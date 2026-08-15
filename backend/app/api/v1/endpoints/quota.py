from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.siswa import Siswa, StatusSPP
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran

router = APIRouter()

@router.get("/siswa/{siswa_id}")
async def get_student_quota(
      siswa_id: int,
      db: Session = Depends(get_db),
      current_user: User = Depends(get_current_user)
):
    siswa = db.query(Siswa).filter(Siswa.id == siswa_id, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data siswa tidak ditemukan"
        )
    if current_user.role in [UserRole.admin, UserRole.owner, UserRole.guru]:
        pass
    elif current_user.role == UserRole.ortu and current_user.uid_terhubung == siswa.uid:
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki akses ke data kuota siswa ini"
        )
    return {
        "siswa_id": siswa.id,
        "nama": siswa.nama,
        "sisa_pertemuan": siswa.sisa_pertemuan,
        "status_spp": siswa.status_spp
    }

@router.post("/siswa/{siswa_id}/restore")
async def restore_student_quota(
      siswa_id: int,
      db: Session = Depends(get_db),
      current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    siswa = db.query(Siswa).filter(Siswa.id == siswa_id, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data siswa tidak ditemukan"
        )
    
    siswa.sisa_pertemuan += siswa.target_pertemuan
    siswa.status_spp = StatusSPP.AKTIF
    db.add(siswa)

    payment = db.query(PembayaranPeriode).filter(
        PembayaranPeriode.id_siswa == siswa_id,
        PembayaranPeriode.status == StatusPembayaran.MENUNGGAK
    ).order_by(PembayaranPeriode.created_at.desc()).first()
    
    if payment:
        payment.status = StatusPembayaran.LUNAS
        db.add(payment)

    db.commit()
    db.refresh(siswa)

    return {
        "message": "Kuota berhasil dipulihkan secara manual",
        "siswa_id": siswa.id,
        "sisa_pertemuan": siswa.sisa_pertemuan,
        "status_spp": siswa.status_spp
    }
