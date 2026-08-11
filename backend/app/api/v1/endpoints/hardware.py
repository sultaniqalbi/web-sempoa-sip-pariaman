from datetime import datetime
from fastapi import APIRouter, Depends, Request
from fastapi.responses import PlainTextResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.hardware import (
    verify_api_key,
    write_last_tap,
    save_unregistered_card,
    get_reset_command,
    acknowledge_reset_command
)
from app.models.guru import Guru
from app.models.absensi_log import AbsensiLog, StatusAbsensi, ModeAbsensi

router = APIRouter()

@router.post("/absensi", response_class=PlainTextResponse)
async def post_absensi(request: Request, db: Session = Depends(get_db)):
    # 1. API Key validation
    api_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
    if not verify_api_key(api_key):
        return PlainTextResponse("UNAUTHORIZED", status_code=401)

    # 2. Extract and validate form body manually to prevent 422 JSON errors
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

    uid = uid.strip().upper()

    try:
        # 3. Query Guru by UID (case-insensitive)
        guru = db.query(Guru).filter(func.upper(Guru.uid) == uid).first()

        if not guru:
            # Save tap as unregistered card for admin auto-fill
            save_unregistered_card(db, uid, waktu_str)
            write_last_tap(uid, waktu_str, "UNREGISTERED")
            return PlainTextResponse("GURU_NOT_FOUND", status_code=200)

        # 4. Check for double tap on the same day (Idempotency)
        today_date = waktu_dt.date()
        duplicate = db.query(AbsensiLog).filter(
            AbsensiLog.uid == uid,
            func.date(AbsensiLog.waktu) == today_date
        ).first()

        if duplicate:
            write_last_tap(uid, waktu_str, "REGISTERED", nama=guru.nama)
            return PlainTextResponse(f"OK|{guru.nama}|SUDAH_TAP", status_code=200)

        # 5. Insert new log to absensi_log
        mode = ModeAbsensi.OFFLINE if mode_str == "OFFLINE" else ModeAbsensi.ONLINE
        new_log = AbsensiLog(
            uid=uid,
            waktu=waktu_dt,
            mode=mode,
            status=StatusAbsensi.HADIR
        )
        db.add(new_log)
        db.commit()

        write_last_tap(uid, waktu_str, "REGISTERED", nama=guru.nama)
        return PlainTextResponse(f"OK|{guru.nama}", status_code=200)

    except Exception as e:
        print(f"Hardware absensi DB error: {e}")
        db.rollback()
        return PlainTextResponse("ERROR_DB", status_code=200)

@router.get("/ping", response_class=PlainTextResponse)
async def get_ping(request: Request):
    api_key = request.headers.get("X-API-Key") or request.headers.get("x-api-key")
    if not verify_api_key(api_key):
        return PlainTextResponse("UNAUTHORIZED", status_code=401)

    ack = request.query_params.get("ack")
    if ack == "1":
        acknowledge_reset_command()
        return PlainTextResponse("OK", status_code=200)

    command = get_reset_command()
    return PlainTextResponse(command, status_code=200)
