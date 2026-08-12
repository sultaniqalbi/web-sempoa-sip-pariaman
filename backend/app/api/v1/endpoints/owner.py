import os
import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.models.users import User, UserRole
from app.models.siswa import Siswa
from app.models.guru import Guru
from app.models.jadwal import Jadwal
from app.models.absensi_log import AbsensiLog
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.bukti_transfer import BuktiTransfer
from app.models.galeri import Galeri
from app.models.audit_log import AuditLog
from pydantic import BaseModel

router = APIRouter()
owner_only = RoleChecker([UserRole.owner])

class RekapBulananRequest(BaseModel):
    bulan: str  # YYYY-MM

class ResetDataRequest(BaseModel):
    confirmation_phrase: str

ALLOWED_RESET_PHRASES = [
    "HAPUS SEMUA DATA SELAMANYA",
    "SETUJU KEHILANGAN SEMUA DATA",
    "RESET DATABASE PRODUKSI"
]

@router.get("/pertumbuhan")
async def get_pertumbuhan_siswa(
    range: str = Query("1tahun", regex="^(6bulan|1tahun|semua)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Tren Pertumbuhan Murid
    """
    # 1. Active students count per program
    program_counts = (
        db.query(Siswa.kategori_program, func.count(Siswa.id))
        .filter(Siswa.is_deleted == False)
        .group_by(Siswa.kategori_program)
        .all()
    )
    per_program = [{"program": p, "jumlah_aktif": c} for p, c in program_counts]

    # 2. Monthly new student growth trend
    # Query grouped by YYYY-MM created_at
    all_students = db.query(Siswa).filter(Siswa.is_deleted == False).order_by(Siswa.created_at.asc()).all()
    
    monthly_map = {}
    for s in all_students:
        month_str = s.created_at.strftime("%Y-%m") if s.created_at else "2026-01"
        monthly_map[month_str] = monthly_map.get(month_str, 0) + 1
        
    sorted_months = sorted(monthly_map.keys())
    
    # Filter range
    if range == "6bulan" and len(sorted_months) > 6:
        sorted_months = sorted_months[-6:]
    elif range == "1tahun" and len(sorted_months) > 12:
        sorted_months = sorted_months[-12:]
        
    per_bulan = []
    cumulative = 0
    for m in sorted_months:
        new_count = monthly_map[m]
        cumulative += new_count
        per_bulan.append({
            "bulan": m,
            "siswa_baru": new_count,
            "kumulatif_aktif": cumulative
        })

    return {
        "range": range,
        "total_aktif": sum(c for _, c in program_counts),
        "per_bulan": per_bulan,
        "per_program": per_program
    }

@router.get("/keuangan")
async def get_laporan_keuangan(
    bulan: Optional[str] = Query(None, regex="^\\d{4}-\\d{2}$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Data Keuangan Lengkap
    """
    if not bulan:
        bulan = datetime.utcnow().strftime("%Y-%m")

    # 1. Total revenue for specified month (LUNAS)
    revenue_q = (
        db.query(func.sum(PembayaranPeriode.jumlah))
        .filter(
            PembayaranPeriode.periode_bulan == bulan,
            PembayaranPeriode.status == StatusPembayaran.LUNAS
        )
        .scalar()
    )
    total_pendapatan = float(revenue_q or 0.0)

    # 2. Breakdown per status for specified month
    status_q = (
        db.query(PembayaranPeriode.status, func.count(PembayaranPeriode.id))
        .filter(PembayaranPeriode.periode_bulan == bulan)
        .group_by(PembayaranPeriode.status)
        .all()
    )
    per_status = [{"status": s.value, "jumlah": c} for s, c in status_q]

    # 3. Revenue per program
    program_rev = (
        db.query(Siswa.kategori_program, func.sum(PembayaranPeriode.jumlah))
        .join(PembayaranPeriode, Siswa.id == PembayaranPeriode.id_siswa)
        .filter(
            PembayaranPeriode.periode_bulan == bulan,
            PembayaranPeriode.status == StatusPembayaran.LUNAS,
            Siswa.is_deleted == False
        )
        .group_by(Siswa.kategori_program)
        .all()
    )
    per_program = [{"program": p, "pendapatan": float(amt or 0)} for p, amt in program_rev]

    # 4. 6-Month Trend
    all_periodes = (
        db.query(PembayaranPeriode.periode_bulan, func.sum(PembayaranPeriode.jumlah))
        .filter(PembayaranPeriode.status == StatusPembayaran.LUNAS)
        .group_by(PembayaranPeriode.periode_bulan)
        .order_by(PembayaranPeriode.periode_bulan.desc())
        .limit(6)
        .all()
    )
    tren_6_bulan = [{"bulan": p, "pendapatan": float(amt or 0)} for p, amt in reversed(all_periodes)]

    return {
        "bulan": bulan,
        "total_pendapatan": total_pendapatan,
        "per_program": per_program,
        "per_status": per_status,
        "tren_6_bulan": tren_6_bulan
    }

@router.post("/rekap-bulanan")
async def generate_rekap_bulanan(
    req: RekapBulananRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Generate & Write Rekap Bulanan to Google Sheets
    """
    bulan = req.bulan
    service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    sheet_id = os.getenv("GOOGLE_SHEET_ID")

    # Aggregate monthly stats
    siswa_aktif = db.query(Siswa).filter(Siswa.is_deleted == False).count()
    revenue = (
        db.query(func.sum(PembayaranPeriode.jumlah))
        .filter(
            PembayaranPeriode.periode_bulan == bulan,
            PembayaranPeriode.status == StatusPembayaran.LUNAS
        )
        .scalar()
    ) or 0.0

    program_stats = (
        db.query(Siswa.kategori_program, func.count(Siswa.id))
        .filter(Siswa.is_deleted == False)
        .group_by(Siswa.kategori_program)
        .all()
    )

    rows = [
        ["REKAP BULANAN SEMPOA SIP TC PARIAMAN"],
        ["Periode", bulan],
        ["Generated At", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")],
        ["Total Siswa Aktif", siswa_aktif],
        ["Total Pendapatan (LUNAS)", float(revenue)],
        [],
        ["Program", "Jumlah Siswa Aktif"]
    ]
    for prog, count in program_stats:
        rows.append([prog, count])

    if not service_account_json or not sheet_id or not os.path.exists(service_account_json):
        return {
            "status": "pending",
            "message": "Google Sheets belum dikonfigurasi (.env GOOGLE_SERVICE_ACCOUNT_JSON atau GOOGLE_SHEET_ID belum valid).",
            "rekap_summary": {
                "bulan": bulan,
                "total_siswa_aktif": siswa_aktif,
                "total_pendapatan": float(revenue),
                "rows_generated": len(rows)
            }
        }

    try:
        import gspread
        gc = gspread.service_account(filename=service_account_json)
        sh = gc.open_by_key(sheet_id)
        tab_name = f"Rekap-{bulan}"

        try:
            ws = sh.worksheet(tab_name)
            ws.clear()
        except Exception:
            ws = sh.add_worksheet(title=tab_name, rows=50, cols=10)

        ws.update("A1", rows)
        sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit#gid={ws.id}"

        return {
            "status": "success",
            "sheet_url": sheet_url,
            "worksheet_name": tab_name,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gagal update Google Sheet: {str(e)}",
            "rekap_summary": {
                "bulan": bulan,
                "total_siswa_aktif": siswa_aktif,
                "total_pendapatan": float(revenue)
            }
        }

@router.post("/reset-data")
async def reset_semua_data(
    req: ResetDataRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    """
    Owner Exclusive: Dual-Factor Safe Reset All Operational Data with Auto-Backup
    """
    # 1. Phrase verification
    phrase = req.confirmation_phrase.strip()
    if phrase not in ALLOWED_RESET_PHRASES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Frasa konfirmasi tidak cocok. Gunakan salah satu dari frasa yang diizinkan."
        )

    timestamp_str = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    backup_filename = f"reset-{timestamp_str}.json"
    backup_dir = Path(os.getenv("BACKUP_DIR", "backups"))
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_filepath = backup_dir / backup_filename

    # 2. Build backup JSON dump
    try:
        siswa_list = [
            {"id": s.id, "nama": s.nama, "program": s.kategori_program, "uid": s.uid}
            for s in db.query(Siswa).all()
        ]
        guru_list = [
            {"id": g.id, "nama": g.nama, "uid": g.uid, "program": g.kategori_program}
            for g in db.query(Guru).all()
        ]
        jadwal_list = [
            {"id": j.id, "hari": j.hari, "jam_mulai": j.jam_mulai}
            for j in db.query(Jadwal).all()
        ]
        pembayaran_list = [
            {"id": p.id, "id_siswa": p.id_siswa, "periode": p.periode_bulan, "jumlah": float(p.jumlah), "status": p.status.value}
            for p in db.query(PembayaranPeriode).all()
        ]

        dump_data = {
            "metadata": {
                "executed_by": current_user.email,
                "executed_at": datetime.utcnow().isoformat(),
                "phrase_used": phrase
            },
            "siswa": siswa_list,
            "guru": guru_list,
            "jadwal": jadwal_list,
            "pembayaran": pembayaran_list
        }

        with open(backup_filepath, "w", encoding="utf-8") as f:
            json.dump(dump_data, f, indent=2)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal membuat backup sebelum reset: {str(e)}"
        )

    # 3. Perform operational data wipe in DB transaction
    try:
        db.query(BuktiTransfer).delete()
        db.query(PembayaranPeriode).delete()
        db.query(AbsensiLog).delete()
        db.query(Jadwal).delete()
        db.query(Guru).delete()
        db.query(Siswa).delete()
        db.query(Galeri).delete()

        # Log action to AuditLog
        audit = AuditLog(
            action="RESET_DATA",
            role=current_user.role.value,
            email=current_user.email,
            details={"phrase": phrase, "backup_filename": backup_filename},
            status="SUCCESS",
            backup_file=str(backup_filepath)
        )
        db.add(audit)
        db.commit()

        return {
            "status": "success",
            "message": f"Data operasional berhasil dihapus. Backup disimpan di: {backup_filename}",
            "backup_file": backup_filename,
            "executed_at": datetime.utcnow().isoformat(),
            "executed_by": current_user.email
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menghapus data di database: {str(e)}"
        )
