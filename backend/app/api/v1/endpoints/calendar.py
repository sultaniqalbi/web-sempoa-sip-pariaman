import urllib.parse
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from ics import Calendar, Event

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.users import User, UserRole
from app.models.siswa import Siswa

router = APIRouter()

def verify_student_access(siswa: Siswa, current_user: User):
    """IDOR Check: Admin/Owner or Own Parent only"""
    if current_user.role in (UserRole.admin, UserRole.owner):
        return
    if current_user.role == UserRole.ortu and (
        current_user.uid_terhubung == str(siswa.id) or current_user.uid_terhubung == siswa.uid
    ):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Anda tidak memiliki akses ke data jadwal kalender siswa ini."
    )

def calculate_spp_due_datetime(siswa: Siswa) -> datetime:
    """Hitung perkiraan tanggal jatuh tempo SPP (pukul 09:00 WIB)"""
    today = date.today()
    # Jika hari ini lewat tgl 10, targetkan tanggal 1 bulan depan, jika belum, tgl 10 bulan ini
    if today.day > 10:
        if today.month == 12:
            target_date = date(today.year + 1, 1, 10)
        else:
            target_date = date(today.year, today.month + 1, 10)
    else:
        target_date = date(today.year, today.month, 10)

    return datetime(target_date.year, target_date.month, target_date.day, 9, 0, 0)

@router.get("/spp/{siswa_id}.ics")
async def download_spp_calendar_ics(
    siswa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download file kalender standar iCalendar (.ics) untuk Apple Calendar, Outlook, atau Google Calendar.
    Dilindungi IDOR Check.
    """
    siswa = db.query(Siswa).filter(Siswa.id == siswa_id, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    verify_student_access(siswa, current_user)

    due_dt = calculate_spp_due_datetime(siswa)
    end_dt = due_dt + timedelta(hours=1)

    cal = Calendar()
    event = Event()
    event.name = f"Jatuh Tempo SPP: {siswa.nama} - Sempoa SIP"
    event.begin = due_dt
    event.end = end_dt
    event.description = (
        f"Pengingat Pembayaran SPP Sempoa SIP TC Pariaman untuk ananda {siswa.nama} "
        f"(Program: {siswa.kategori_program or 'Sempoa SIP'}).\n\n"
        f"Portal Pembayaran: https://sempoasippariaman.com/login"
    )
    event.location = "Sempoa SIP TC Pariaman, Kota Pariaman"
    cal.events.add(event)

    clean_name = "".join(c for c in siswa.nama if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
    filename = f"Jadwal_SPP_{clean_name}.ics"

    return Response(
        content=str(cal),
        media_type="text/calendar",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate"
        }
    )

@router.get("/spp/{siswa_id}/google-url")
async def get_google_calendar_url(
    siswa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate tautan langsung web Google Calendar untuk menambahkan pengingat jatuh tempo SPP.
    Dilindungi IDOR Check.
    """
    siswa = db.query(Siswa).filter(Siswa.id == siswa_id, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    verify_student_access(siswa, current_user)

    due_dt = calculate_spp_due_datetime(siswa)
    end_dt = due_dt + timedelta(hours=1)

    # Format UTC Google Calendar: YYYYMMDDTHHMMSSZ (WIB is UTC+7)
    start_utc = due_dt - timedelta(hours=7)
    end_utc = end_dt - timedelta(hours=7)
    dates_param = f"{start_utc.strftime('%Y%m%dT%H%M%SZ')}/{end_utc.strftime('%Y%m%dT%H%M%SZ')}"

    title = f"Jatuh Tempo SPP: {siswa.nama} - Sempoa SIP"
    details = (
        f"Pengingat Pembayaran SPP Sempoa SIP TC Pariaman untuk ananda {siswa.nama} "
        f"(Program: {siswa.kategori_program or 'Sempoa SIP'}).\n"
        f"Portal: https://sempoasippariaman.com/login"
    )
    location = "Sempoa SIP TC Pariaman"

    params = {
        "action": "TEMPLATE",
        "text": title,
        "dates": dates_param,
        "details": details,
        "location": location
    }

    gcal_url = f"https://calendar.google.com/calendar/render?{urllib.parse.urlencode(params)}"
    return {
        "status": "success",
        "siswa_id": siswa.id,
        "siswa_nama": siswa.nama,
        "due_date": due_dt.strftime("%Y-%m-%d %H:%M WIB"),
        "google_calendar_url": gcal_url
    }
