import os
from typing import List, Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.siswa import Siswa, StatusSPP
from app.models.absensi_log import AbsensiLog, StatusAbsensi
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.schemas.absensi import AbsensiCreate, AbsensiResponse
from app.crud import absensi as crud_absensi
from pydantic import BaseModel

router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

class BulkSiswaAbsensiItem(BaseModel):
    id_siswa: int
    status: StatusAbsensi  # HADIR / ALFA / IZIN

class BulkSiswaAbsensiRequest(BaseModel):
    tanggal: str  # YYYY-MM-DD
    absensi: List[BulkSiswaAbsensiItem]

@router.get("/", response_model=List[AbsensiResponse])
async def read_absensi_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    return crud_absensi.get_absensi_list(db, skip=skip, limit=limit)

@router.get("/guru-log")
async def get_laporan_absensi_guru(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Laporan Tap RFID Guru + Auto-Detect Guru Tidak Hadir
    """
    gurus = db.query(Guru).all()
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    today_day_name = datetime.utcnow().strftime("%A") # e.g. 'Monday'

    # Day mapping ID
    day_map = {
        "Monday": "Senin", "Tuesday": "Selasa", "Wednesday": "Rabu",
        "Thursday": "Kamis", "Friday": "Jumat", "Saturday": "Sabtu", "Sunday": "Minggu"
    }
    hari_ini_id = day_map.get(today_day_name, "Senin")

    result = []
    for g in gurus:
        # Check tap log today
        logs_today = (
            db.query(AbsensiLog)
            .filter(AbsensiLog.uid == g.uid)
            .order_by(AbsensiLog.waktu.desc())
            .all()
        )

        is_wajib_today = hari_ini_id.lower() in (g.hari_wajib or "").lower()
        tap_today = [l for l in logs_today if l.waktu.strftime("%Y-%m-%d") == today_str]

        if tap_today:
            status_guru = tap_today[0].status.value
            jam_tap = tap_today[0].waktu.strftime("%H:%M")
        elif is_wajib_today:
            status_guru = "TIDAK_HADIR"
            jam_tap = "-"
        else:
            status_guru = "LIBUR"
            jam_tap = "-"

        result.append({
            "id_guru": g.id,
            "uid": g.uid,
            "nama_guru": g.nama,
            "kategori_program": g.kategori_program,
            "hari_wajib": g.hari_wajib,
            "is_wajib_today": is_wajib_today,
            "status_hari_ini": status_guru,
            "jam_tap_terakhir": jam_tap,
            "total_tap_bulan_ini": len([l for l in logs_today if l.waktu.strftime("%Y-%m") == today_str[:7]])
        })

    return result

@router.get("/guru/{guru_id}", response_model=List[AbsensiResponse])
async def read_absensi_by_guru(
    guru_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    guru = db.query(Guru).filter(Guru.id == guru_id).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")
    if current_user.role in [UserRole.admin, UserRole.owner]:
        pass
    elif current_user.role == UserRole.guru and (current_user.uid_terhubung == guru.uid or current_user.uid_terhubung == str(guru.id)):
        pass
    else:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke log absensi guru ini")
    return crud_absensi.get_absensi_by_guru(db, uid=guru.uid, skip=skip, limit=limit)

@router.get("/siswa/{siswa_id}", response_model=List[AbsensiResponse])
async def read_absensi_by_siswa(
    siswa_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    siswa = db.query(Siswa).filter(Siswa.id == siswa_id, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")
    if current_user.role in [UserRole.admin, UserRole.owner, UserRole.guru]:
        pass
    elif current_user.role == UserRole.ortu and (current_user.uid_terhubung == siswa.uid or current_user.uid_terhubung == str(siswa.id)):
        pass
    else:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke log absensi siswa ini")
    return crud_absensi.get_absensi_by_siswa(db, uid=siswa.uid, skip=skip, limit=limit)

@router.post("/bulk-siswa")
async def bulk_absensi_siswa(
    req: BulkSiswaAbsensiRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    """
    Input Absensi Siswa Massal oleh Guru.
    Jika status HADIR: kurangi sisa_pertemuan -= 1. Jika mencapai 0: set status_spp EXPIRED dan buat tagihan MENUNGGAK 150rb.
    """
    processed = 0
    waktu_absensi = datetime.strptime(req.tanggal, "%Y-%m-%d") if req.tanggal else datetime.utcnow()

    for item in req.absensi:
        siswa = db.query(Siswa).filter(Siswa.id == item.id_siswa, Siswa.is_deleted == False).first()
        if not siswa:
            continue

        # Record log
        absensi_log = AbsensiLog(
            uid=siswa.uid,
            waktu=waktu_absensi,
            status=item.status
        )
        db.add(absensi_log)

        if item.status == StatusAbsensi.HADIR:
            siswa.sisa_pertemuan = max(0, siswa.sisa_pertemuan - 1)
            if siswa.sisa_pertemuan == 0:
                siswa.status_spp = StatusSPP.EXPIRED
                current_month = waktu_absensi.strftime("%Y-%m")
                due_date = waktu_absensi.date() + timedelta(days=7)
                billing = PembayaranPeriode(
                    id_siswa=siswa.id,
                    periode_bulan=current_month,
                    jumlah=150000.00,
                    status=StatusPembayaran.MENUNGGAK,
                    due_date=due_date
                )
                db.add(billing)

        processed += 1

    db.commit()
    return {"status": "success", "processed_count": processed}

@router.post("/", response_model=AbsensiResponse, status_code=status.HTTP_201_CREATED)
async def create_new_absensi_log(
    absensi_in: AbsensiCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    log = crud_absensi.create_absensi(db, absensi=absensi_in)

    siswa = db.query(Siswa).filter(Siswa.uid == absensi_in.uid.upper().strip(), Siswa.is_deleted == False).first()
    if siswa and absensi_in.status == StatusAbsensi.HADIR:
        siswa.sisa_pertemuan = max(0, siswa.sisa_pertemuan - 1)
        if siswa.sisa_pertemuan == 0:
            siswa.status_spp = StatusSPP.EXPIRED
            current_month = date.today().strftime("%Y-%m")
            billing = PembayaranPeriode(
                id_siswa=siswa.id,
                periode_bulan=current_month,
                jumlah=150000.00,
                status=StatusPembayaran.MENUNGGAK,
                due_date=date.today() + timedelta(days=7)
            )
            db.add(billing)
        db.commit()

    return log

@router.post("/export-sheets")
async def export_absensi_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    from app.services.google_sheets import send_to_google_sheet

    items = db.query(AbsensiLog).order_by(AbsensiLog.waktu.desc()).limit(500).all()
    rows = [["ID Log", "UID", "Nama Terkait", "Waktu Tap", "Mode", "Status Absensi"]]
    for a in items:
        guru = db.query(Guru).filter(Guru.uid == a.uid).first()
        siswa = db.query(Siswa).filter(Siswa.uid == a.uid).first()
        nama = guru.nama if guru else (siswa.nama if siswa else "Kartu Belum Terdaftar")
        mode_str = a.mode.value if hasattr(a.mode, 'value') else str(a.mode)
        status_str = a.status.value if hasattr(a.status, 'value') else str(a.status)
        rows.append([a.id, a.uid, nama, a.waktu.strftime("%Y-%m-%d %H:%M:%S") if a.waktu else "-", mode_str, status_str])

    tab_name = f"Absensi_{datetime.utcnow().strftime('%Y%m%d')}"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Log Absensi RFID")

