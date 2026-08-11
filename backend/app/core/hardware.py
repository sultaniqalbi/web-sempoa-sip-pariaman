import hmac
import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.pendaftaran_baru import PendaftaranBaru, StatusPendaftaran

LAST_TAP_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../last_tap.json"))
RESET_FLAG_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../reset_flag.txt"))

def verify_api_key(api_key: str) -> bool:
    if not api_key:
        return False
    return hmac.compare_digest(api_key.strip(), settings.esp32_api_key.strip())

def write_last_tap(uid: str, waktu: str, status: str, nama: str = None) -> None:
    tap_data = {
        "uid": uid.upper().strip(),
        "waktu": waktu.strip(),
        "status": status
    }
    if nama:
        tap_data["nama"] = nama
    try:
        with open(LAST_TAP_FILE, "w", encoding="utf-8") as f:
            json.dump(tap_data, f, indent=4)
    except Exception as e:
        print(f"Error writing last_tap.json: {e}")

def save_unregistered_card(db: Session, uid: str, waktu_str: str) -> None:
    catatan_prefix = f"Unregistered card tapped: {uid.upper().strip()}"
    existing = db.query(PendaftaranBaru).filter(
        PendaftaranBaru.catatan.like(f"%{catatan_prefix}%")
    ).first()
    
    if not existing:
        try:
            waktu_dt = datetime.strptime(waktu_str.strip(), "%Y-%m-%d %H:%M:%S")
        except ValueError:
            waktu_dt = datetime.now()

        pendaftaran = PendaftaranBaru(
            nama_ortu="RFID_HARDWARE",
            nama_anak=f"UNREGISTERED_{uid.upper().strip()}",
            umur_anak="0",
            nomor_wa="0",
            program_studi="UNKNOWN",
            catatan=f"Unregistered card tapped: {uid.upper().strip()} at {waktu_str}",
            waktu_daftar=waktu_dt,
            status=StatusPendaftaran.BARU
        )
        db.add(pendaftaran)
        db.commit()

def get_reset_command() -> str:
    if os.path.exists(RESET_FLAG_FILE):
        try:
            with open(RESET_FLAG_FILE, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content == "FULL_RESET":
                    return "FULL_RESET"
                return "RESET"
        except Exception:
            return "OK"
    return "OK"

def acknowledge_reset_command() -> None:
    if os.path.exists(RESET_FLAG_FILE):
        try:
            os.remove(RESET_FLAG_FILE)
        except Exception as e:
            print(f"Error removing reset_flag.txt: {e}")
