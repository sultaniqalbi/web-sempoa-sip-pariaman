import hmac
import json
import os
import threading
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.pendaftaran_baru import PendaftaranBaru, StatusPendaftaran

LAST_TAP_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../last_tap.json"))
RESET_FLAG_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../reset_flag.txt"))

_tap_lock = threading.Lock()
_latest_tap_cache: Dict[str, Any] = {
    "uid": None,
    "waktu": None,
    "status": None,
    "nama": None,
    "timestamp": None
}

def verify_api_key(api_key: str) -> bool:
    if not api_key:
        return False
    return hmac.compare_digest(api_key.strip(), settings.esp32_api_key.strip())

GLITCH_UIDS = {"FF FF FF FF", "00 00 00 00", "FFFFFFFF", "00000000"}

def write_last_tap(uid: str, waktu: str, status: str, nama: str = None) -> None:
    global _latest_tap_cache
    if not uid:
        return
    uid_clean = uid.upper().strip()
    if uid_clean in GLITCH_UIDS:
        return  # Ignore glitch or dummy cards

    tap_data = {
        "uid": uid_clean,
        "waktu": waktu.strip(),
        "status": status,
        "nama": nama,
        "timestamp": datetime.now().isoformat()
    }
    with _tap_lock:
        _latest_tap_cache = tap_data.copy()

    try:
        with open(LAST_TAP_FILE, "w", encoding="utf-8") as f:
            json.dump(tap_data, f, indent=4)
    except Exception as e:
        print(f"Error writing last_tap.json: {e}")

def get_latest_tap_data(max_age_seconds: int = 60) -> Dict[str, Any]:
    global _latest_tap_cache
    
    def _is_valid_and_fresh(data: Dict[str, Any]) -> bool:
        if not data or not data.get("uid"):
            return False
        uid_clean = str(data["uid"]).strip().upper()
        if uid_clean in GLITCH_UIDS:
            return False
        ts_str = data.get("timestamp")
        if ts_str:
            try:
                ts = datetime.fromisoformat(ts_str)
                age = (datetime.now() - ts).total_seconds()
                if age > max_age_seconds or age < -60:
                    return False
                return True
            except Exception:
                return False
        waktu_str = data.get("waktu")
        if waktu_str:
            try:
                waktu_dt = datetime.strptime(waktu_str.strip(), "%Y-%m-%d %H:%M:%S")
                age = (datetime.now() - waktu_dt).total_seconds()
                if age > max_age_seconds or age < -60:
                    return False
                return True
            except Exception:
                return False
        return False

    with _tap_lock:
        if _latest_tap_cache.get("uid") and _is_valid_and_fresh(_latest_tap_cache):
            return _latest_tap_cache.copy()

    if os.path.exists(LAST_TAP_FILE):
        try:
            with open(LAST_TAP_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if _is_valid_and_fresh(data):
                    with _tap_lock:
                        _latest_tap_cache = data.copy()
                    return data
        except Exception as e:
            print(f"Error reading last_tap.json: {e}")

    return {"uid": None, "is_new": False}
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
