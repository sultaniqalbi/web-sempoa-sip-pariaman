import os
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

WIB = timezone(timedelta(hours=7))

from app.core.database import get_db
from app.core.websocket import manager
from app.core.hardware import (
    verify_api_key,
    write_last_tap,
    get_latest_tap_data,
    save_unregistered_card,
    get_reset_command,
    acknowledge_reset_command
)
from app.core.rate_limit import hardware_limiter
from app.models.guru import Guru
from app.models.absensi_log import AbsensiLog, StatusAbsensi, ModeAbsensi

router = APIRouter()

@router.post("/absensi", response_class=PlainTextResponse)
async def post_absensi(request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"

    # 1. Rate limiting & Brute force check
    if hardware_limiter.is_auth_blocked(client_ip):
        return PlainTextResponse("RATE_LIMITED", status_code=429)

    if hardware_limiter.is_rate_limited(client_ip):
        return PlainTextResponse("RATE_LIMITED", status_code=429)

    # 2. API Key validation
    api_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
    if not verify_api_key(api_key):
        hardware_limiter.record_auth_failure(client_ip)
        return PlainTextResponse("UNAUTHORIZED", status_code=401)

    hardware_limiter.reset_auth_failures(client_ip)

    # 3. Extract and validate form body manually to prevent 422 JSON errors
    try:
        form_data = await request.form()
        uid = form_data.get("uid")
        waktu_str = form_data.get("waktu")
        mode_str = form_data.get("mode", "ONLINE").upper()
    except Exception:
        return PlainTextResponse("ERROR_UID_KOSONG", status_code=200)

    if not uid or not uid.strip():
        return PlainTextResponse("ERROR_UID_KOSONG", status_code=200)
    
    if not waktu_str or not waktu_str.strip():
        return PlainTextResponse("ERROR_WAKTU_FORMAT", status_code=200)

    # Validate waktu format (YYYY-MM-DD HH:MM:SS) - Explicit WIB (UTC+7)
    try:
        waktu_dt = datetime.strptime(waktu_str.strip(), "%Y-%m-%d %H:%M:%S").replace(tzinfo=WIB)
    except ValueError:
        return PlainTextResponse("ERROR_WAKTU_FORMAT", status_code=200)

    uid_clean = uid.strip().upper()
    uid_nospace = uid_clean.replace(" ", "")

    try:
        # 1. Cek Eksklusif di Database Guru (Pegawai & Owner yang aktif)
        guru = db.query(Guru).filter(
            ((func.upper(Guru.uid) == uid_clean) |
            (func.replace(func.upper(Guru.uid), " ", "") == uid_nospace)),
            Guru.is_deleted == False
        ).first()

        # 2. Jika Kartu Belum Terdaftar sebagai Guru -> KARTU BARU (untuk Pendaftaran Guru)
        if not guru:
            save_unregistered_card(db, uid_clean, waktu_str)
            write_last_tap(uid_clean, waktu_str, "UNREGISTERED")

            manager.broadcast_sync("CARD_TAP", {
                "timestamp": datetime.now(WIB).isoformat(),
                "uid": uid_clean,
                "waktu": waktu_str,
                "status": "UNREGISTERED"
            })
            return PlainTextResponse(f"KARTU_BARU|{uid_clean}", status_code=200)

        # 3. KARTU GURU TERDAFTAR
        nama_guru = guru.nama
        matched_uid = guru.uid

        write_last_tap(uid_clean, waktu_str, "REGISTERED", nama=nama_guru)

        # Broadcast card tap event for real-time listeners
        manager.broadcast_sync("CARD_TAP", {
            "timestamp": datetime.now(WIB).isoformat(),
            "uid": uid_clean,
            "waktu": waktu_str,
            "status": "REGISTERED",
            "nama": nama_guru
        })

        # Cek duplikasi tap hari ini dalam zona WIB (Idempotency - DB Agnostic)
        today_date = waktu_dt.astimezone(WIB).date()
        today_start = datetime.combine(today_date, datetime.min.time())
        today_end = datetime.combine(today_date, datetime.max.time())
        duplicate = db.query(AbsensiLog).filter(
            (AbsensiLog.uid == uid_clean) | (AbsensiLog.uid == matched_uid),
            AbsensiLog.waktu >= today_start,
            AbsensiLog.waktu <= today_end
        ).first()

        if duplicate:
            waktu_wib = waktu_dt.astimezone(WIB)
            jam_keluar_threshold = 16
            if getattr(guru, "jam_keluar", None):
                try:
                    jam_keluar_threshold = int(guru.jam_keluar.split(":")[0])
                except Exception:
                    jam_keluar_threshold = 16

            # Jika tap di jam keluar ke atas (atau jam 16:00 ke atas), hitung sebagai waktu keluar / tap out
            if waktu_wib.hour >= jam_keluar_threshold or waktu_wib.hour >= 16:
                # Maksimal waktu keluar jam 18:00
                if waktu_wib.hour >= 18 and (waktu_wib.hour > 18 or waktu_wib.minute > 0):
                    waktu_keluar_capped = waktu_wib.replace(hour=18, minute=0, second=0, microsecond=0)
                else:
                    waktu_keluar_capped = waktu_wib
                
                duplicate.waktu_keluar = waktu_keluar_capped
                db.commit()
                
                manager.broadcast_sync("ABSENSI_UPDATE", {
                    "timestamp": datetime.now(WIB).isoformat(),
                    "source": "rfid_hardware",
                    "uid": matched_uid,
                    "nama": nama_guru,
                    "role": "guru",
                    "waktu_keluar": waktu_keluar_capped.isoformat(),
                    "status": "PULANG"
                })
                
                return PlainTextResponse(f"PULANG|{nama_guru}", status_code=200)
                
            return PlainTextResponse(f"OK|{nama_guru}", status_code=200)

        # Cek Keterlambatan - HANYA Direktur yang bebas keterlambatan
        is_late = False
        nama_lower = nama_guru.lower()
        kat_lower = (getattr(guru, "kategori_program", "") or "").lower()
        is_direktur = ("direktur" in nama_lower) or ("direktur" in kat_lower) or ("zulhemawati" in nama_lower)
        waktu_wib = waktu_dt.astimezone(WIB)
        
        if is_direktur:
            is_late = False
        else:
            if "dinda" in nama_lower:
                if waktu_wib.weekday() == 4: # Jumat (masuk 12:00)
                    batas_telat = 13
                elif waktu_wib.weekday() == 5: # Sabtu (masuk 09:00)
                    batas_telat = 10
                else:
                    batas_telat = 8
            elif "husna" in nama_lower:
                batas_telat = 8
            else:
                jam_masuk_str = getattr(guru, "jam_masuk", "07:00")
                try:
                    batas_telat = int(jam_masuk_str.split(":")[0]) + 1
                except:
                    batas_telat = 8
                    
            if waktu_wib.hour >= batas_telat:
                is_late = True

        status_absen = StatusAbsensi.TERLAMBAT if is_late else StatusAbsensi.HADIR

        # Catat Log Absensi Kehadiran Guru (Tap Masuk)
        mode = ModeAbsensi.OFFLINE if mode_str == "OFFLINE" else ModeAbsensi.ONLINE
        new_log = AbsensiLog(
            uid=matched_uid,
            waktu=waktu_dt,
            waktu_keluar=None,
            mode=mode,
            status=status_absen
        )
        db.add(new_log)
        db.commit()

        manager.broadcast_sync("ABSENSI_UPDATE", {
            "timestamp": datetime.now(WIB).isoformat(),
            "source": "rfid_hardware",
            "uid": matched_uid,
            "nama": nama_guru,
            "role": "guru",
            "waktu": waktu_str,
            "waktu_keluar": None,
            "status": "TERLAMBAT" if is_late else "HADIR"
        })

        if is_late:
            return PlainTextResponse(f"LATE|{nama_guru}", status_code=200)
        return PlainTextResponse(f"OK|{nama_guru}", status_code=200)

    except Exception as e:
        print(f"Hardware absensi DB error: {e}")
        db.rollback()
        return PlainTextResponse("ERROR_DB", status_code=200)

@router.get("/ping", response_class=PlainTextResponse)
async def get_ping(request: Request):
    client_ip = request.client.host if request.client else "unknown"

    if hardware_limiter.is_auth_blocked(client_ip):
        return PlainTextResponse("RATE_LIMITED", status_code=429)

    if hardware_limiter.is_rate_limited(client_ip):
        return PlainTextResponse("RATE_LIMITED", status_code=429)

    api_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
    if not verify_api_key(api_key):
        hardware_limiter.record_auth_failure(client_ip)
        return PlainTextResponse("UNAUTHORIZED", status_code=401)

    hardware_limiter.reset_auth_failures(client_ip)

    ack = request.query_params.get("ack")
    if ack == "1":
        acknowledge_reset_command()
        return PlainTextResponse("OK", status_code=200)

    command = get_reset_command()
    return PlainTextResponse(command, status_code=200)

@router.get("/last-tap")
async def get_last_tap(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Mengambil data tap kartu terakhir untuk auto-fill form pendaftaran & edit guru secara realtime.
    """
    data = get_latest_tap_data()
    uid = data.get("uid")
    status = data.get("status")
    waktu = data.get("waktu")
    nama = data.get("nama")

    if not uid:
        return {"uid": None, "is_new": False}

    uid_clean = uid.strip().upper()
    uid_nospace = uid_clean.replace(" ", "")

    # Cek apakah sudah ada guru aktif dengan UID ini di database
    existing = db.query(Guru).filter(
        ((func.upper(Guru.uid) == uid_clean) |
        (func.replace(func.upper(Guru.uid), " ", "") == uid_nospace)),
        Guru.is_deleted == False
    ).first()

    return {
        "uid": uid_clean,
        "waktu": waktu,
        "status": status,
        "nama": existing.nama if existing else nama,
        "is_registered": existing is not None,
        "is_new": existing is None,
        "timestamp": data.get("timestamp") or datetime.now().isoformat()
    }

@router.get("/guru-cache", response_class=PlainTextResponse)
async def get_guru_cache(request: Request, db: Session = Depends(get_db)):
    """
    Mengembalikan seluruh daftar UID & Nama Guru aktif untuk cache offline hardware ESP32.
    Format: UID:Nama|UID:Nama|...
    """
    client_ip = request.client.host if request.client else "unknown"

    if hardware_limiter.is_auth_blocked(client_ip) or hardware_limiter.is_rate_limited(client_ip):
        return PlainTextResponse("RATE_LIMITED", status_code=429)

    api_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
    if not verify_api_key(api_key):
        hardware_limiter.record_auth_failure(client_ip)
        return PlainTextResponse("UNAUTHORIZED", status_code=401)

    hardware_limiter.reset_auth_failures(client_ip)

    try:
        gurus = db.query(Guru).filter(Guru.is_deleted == False).all()
        records = []
        for g in gurus:
            if g.uid and g.uid.strip():
                clean_uid = g.uid.strip().replace(" ", "").upper()
                nama = g.nama.strip()
                kat_lower = (g.kategori_program or "").lower()
                paket_lower = (g.paket_pengajaran or "").lower()
                records.append(f"{clean_uid}:{nama}")
        return PlainTextResponse("|".join(records), status_code=200)
    except Exception:
        return PlainTextResponse("", status_code=200)


