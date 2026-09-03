from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.dependencies import RoleChecker, get_current_user
from app.models.users import User, UserRole
from app.models.siswa import Siswa, StatusSPP
from app.models.guru import Guru
from app.models.jadwal import Jadwal
from app.models.absensi_log import AbsensiLog, StatusAbsensi
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.bukti_transfer import BuktiTransfer, StatusBuktiTransfer

router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

@router.get("/dashboard")
@router.get("/stats")
async def get_portal_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Summary Stats untuk Dashboard Shared Admin & Owner (Redis micro-cached 5s)
    """
    import json
    from app.core.redis import redis_client

    WIB = timezone(timedelta(hours=7))
    today_wib = datetime.now(WIB).date()
    cache_key = f"cache:portal:stats:{today_wib}"
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    if redis_client:
        try:
            raw_cached = redis_client.get(cache_key)
            if raw_cached:
                cached_data = json.loads(raw_cached)
                cached_data["user_name"] = current_user.nama
                cached_data["role"] = role_str
                return cached_data
        except Exception:
            pass

    try:
        total_siswa = db.query(Siswa).filter(Siswa.is_deleted == False).count()
        siswa_aktif = db.query(Siswa).filter(Siswa.is_deleted == False, Siswa.status_spp == StatusSPP.AKTIF).count()
        siswa_expired = db.query(Siswa).filter(Siswa.is_deleted == False, Siswa.status_spp == StatusSPP.EXPIRED).count()
        total_guru = db.query(Guru).filter(Guru.is_deleted == False).count()
        total_jadwal = db.query(Jadwal).count()

        from datetime import time
        today_start = datetime.combine(today_wib, time.min).replace(tzinfo=WIB)
        today_end = datetime.combine(today_wib, time.max).replace(tzinfo=WIB)

        absensi_hari_ini = (
            db.query(AbsensiLog)
            .filter(AbsensiLog.waktu >= today_start, AbsensiLog.waktu <= today_end)
            .count()
        )

        pending_verifikasi = (
            db.query(BuktiTransfer)
            .filter(BuktiTransfer.status == StatusBuktiTransfer.pending)
            .count()
        )

        stats_payload = {
            "total_siswa": total_siswa,
            "siswa_aktif": siswa_aktif,
            "siswa_expired": siswa_expired,
            "total_guru": total_guru,
            "total_jadwal": total_jadwal,
            "absensi_hari_ini": absensi_hari_ini,
            "pending_verifikasi": pending_verifikasi,
        }

        if redis_client:
            try:
                redis_client.setex(cache_key, 5, json.dumps(stats_payload))
            except Exception:
                pass

    except Exception as e:
        total_siswa = 0
        siswa_aktif = 0
        siswa_expired = 0
        total_guru = 0
        total_jadwal = 0
        absensi_hari_ini = 0
        pending_verifikasi = 0

    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    return {
        "total_siswa": total_siswa,
        "siswa_aktif": siswa_aktif,
        "siswa_expired": siswa_expired,
        "total_guru": total_guru,
        "total_jadwal": total_jadwal,
        "absensi_hari_ini": absensi_hari_ini,
        "pending_verifikasi": pending_verifikasi,
        "user_name": current_user.nama,
        "role": role_str
    }

@router.get("/catatan-pembelajaran/{id_siswa}")
async def get_catatan_siswa(
    id_siswa: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.catatan_pembelajaran import CatatanPembelajaran
    from sqlalchemy import or_
    
    try:
        int_id = int(id_siswa)
        siswa = db.query(Siswa).filter(
            (Siswa.id == int_id) | (Siswa.uid == id_siswa),
            Siswa.is_deleted == False
        ).first()
    except (ValueError, TypeError):
        siswa = db.query(Siswa).filter(
            Siswa.uid == str(id_siswa),
            Siswa.is_deleted == False
        ).first()

    if not siswa:
        return {"catatan": []}

    # IDOR Check: Parents can only access their own linked child's notes
    if current_user.role == UserRole.ortu:
        if current_user.uid_terhubung not in [str(siswa.id), siswa.uid]:
            raise HTTPException(status_code=403, detail="Anda tidak memiliki hak akses untuk melihat catatan siswa ini.")

    notes = db.query(CatatanPembelajaran).filter(
        or_(
            CatatanPembelajaran.id_siswa == siswa.id,
            func.lower(CatatanPembelajaran.kategori_program) == func.lower(siswa.kategori_program or "")
        )
    ).order_by(CatatanPembelajaran.created_at.desc()).limit(10).all()

    result = []
    for n in notes:
        guru = db.query(Guru).filter(Guru.id == n.id_guru).first() if n.id_guru else None
        result.append({
            "id": n.id,
            "tanggal": n.tanggal.strftime("%d %B %Y") if n.tanggal else "",
            "catatan": n.catatan,
            "nama_guru": guru.nama if guru else "Guru Pengajar",
            "waktu": n.created_at.strftime("%H:%M WIB") if n.created_at else ""
        })

    return {"catatan": result}

