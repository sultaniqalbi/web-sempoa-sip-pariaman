import os
import json
from datetime import datetime
from fastapi import APIRouter, Depends, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.websocket import manager
from app.core.hardware import (
    verify_api_key,
    write_last_tap,
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

    # Validate waktu format (YYYY-MM-DD HH:MM:SS)
    try:
        waktu_dt = datetime.strptime(waktu_str.strip(), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return PlainTextResponse("ERROR_WAKTU_FORMAT", status_code=200)

    uid_clean = uid.strip().upper()
    uid_nospace = uid_clean.replace(" ", "")

    try:
        # 1. Cek Eksklusif di Database Guru (Pegawai & Owner)
        guru = db.query(Guru).filter(
            (func.upper(Guru.uid) == uid_clean) |
            (func.replace(func.upper(Guru.uid), " ", "") == uid_nospace)
        ).first()

        # 2. Jika Kartu Belum Terdaftar sebagai Guru -> KARTU BARU (untuk Pendaftaran Guru)
        if not guru:
            save_unregistered_card(db, uid_clean, waktu_str)
            write_last_tap(uid_clean, waktu_str, "UNREGISTERED")

            manager.broadcast_sync("CARD_TAP", {
                "timestamp": datetime.now().isoformat(),
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
            "timestamp": datetime.now().isoformat(),
            "uid": uid_clean,
            "waktu": waktu_str,
            "status": "REGISTERED",
            "nama": nama_guru
        })

        # Cek duplikasi tap hari ini (Idempotency)
        today_date = waktu_dt.date()
        duplicate = db.query(AbsensiLog).filter(
            (AbsensiLog.uid == uid_clean) | (AbsensiLog.uid == matched_uid),
            func.date(AbsensiLog.waktu) == today_date
        ).first()

        if duplicate:
            return PlainTextResponse(f"OK|{nama_guru}", status_code=200)

        # Catat Log Absensi Kehadiran Guru
        mode = ModeAbsensi.OFFLINE if mode_str == "OFFLINE" else ModeAbsensi.ONLINE
        new_log = AbsensiLog(
            uid=matched_uid,
            waktu=waktu_dt,
            mode=mode,
            status=StatusAbsensi.HADIR
        )
        db.add(new_log)
        db.commit()

        manager.broadcast_sync("ABSENSI_UPDATE", {
            "timestamp": datetime.now().isoformat(),
            "source": "rfid_hardware",
            "uid": matched_uid,
            "nama": nama_guru,
            "role": "guru",
            "waktu": waktu_str,
            "status": "HADIR"
        })

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
    client_ip = request.client.host if request.client else "unknown"
    if hardware_limiter.is_auth_blocked(client_ip) or hardware_limiter.is_rate_limited(client_ip):
        return {"uid": None, "is_new": False}

    last_tap_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../last_tap.json"))
    if not os.path.exists(last_tap_file):
        return {"uid": None, "is_new": False}

    try:
        with open(last_tap_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            uid = data.get("uid")
            status = data.get("status")
            waktu = data.get("waktu")
            nama = data.get("nama")

            if not uid:
                return {"uid": None, "is_new": False}

            uid_clean = uid.strip().upper()
            uid_nospace = uid_clean.replace(" ", "")

            # Cek apakah sudah ada guru dengan UID ini di database
            existing = db.query(Guru).filter(
                (func.upper(Guru.uid) == uid_clean) |
                (func.replace(func.upper(Guru.uid), " ", "") == uid_nospace)
            ).first()

            return {
                "uid": uid_clean,
                "waktu": waktu,
                "status": status,
                "nama": existing.nama if existing else nama,
                "is_registered": existing is not None,
                "is_new": existing is None,
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        return {"uid": None, "is_new": False}

@router.get("/guru-cache", response_class=PlainTextResponse)
async def get_guru_cache(request: Request, db: Session = Depends(get_db)):
    """
    Mengembalikan seluruh daftar UID & Nama Guru untuk cache offline hardware ESP32.
    Format: UID:Nama|UID:Nama|...
    Dilindungi dengan X-API-Key dan Rate Limiter sesuai SECURITY_STANDARDS.md.
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
        gurus = db.query(Guru).all()
        records = []
        for g in gurus:
            if g.uid and g.uid.strip():
                clean_uid = g.uid.strip().replace(" ", "").upper()
                nama = g.nama.strip()
                records.append(f"{clean_uid}:{nama}")
        return PlainTextResponse("|".join(records), status_code=200)
    except Exception:
        return PlainTextResponse("", status_code=200)


