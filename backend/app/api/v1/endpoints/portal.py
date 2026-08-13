from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.models.users import User, UserRole
from app.models.siswa import Siswa, StatusSPP
from app.models.guru import Guru
from app.models.jadwal import Jadwal
from app.models.absensi_log import AbsensiLog, StatusAbsensi
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran

router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

@router.get("/dashboard")
@router.get("/stats")
async def get_portal_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Summary Stats untuk Dashboard Shared Admin & Owner
    """
    total_siswa = db.query(Siswa).filter(Siswa.is_deleted == False).count()
    siswa_aktif = db.query(Siswa).filter(Siswa.is_deleted == False, Siswa.status_spp == StatusSPP.AKTIF).count()
    siswa_expired = db.query(Siswa).filter(Siswa.is_deleted == False, Siswa.status_spp == StatusSPP.EXPIRED).count()

    total_guru = db.query(Guru).count()
    total_jadwal = db.query(Jadwal).count()

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    absensi_hari_ini = (
        db.query(AbsensiLog)
        .filter(func.to_char(AbsensiLog.waktu, 'YYYY-MM-DD') == today_str)
        .count()
    )

    pending_verifikasi = (
        db.query(PembayaranPeriode)
        .filter(PembayaranPeriode.status == StatusPembayaran.PENDING_VERIFIKASI)
        .count()
    )

    return {
        "total_siswa": total_siswa,
        "siswa_aktif": siswa_aktif,
        "siswa_expired": siswa_expired,
        "total_guru": total_guru,
        "total_jadwal": total_jadwal,
        "absensi_hari_ini": absensi_hari_ini,
        "pending_verifikasi": pending_verifikasi,
        "user_name": current_user.nama,
        "role": current_user.role.value
    }
