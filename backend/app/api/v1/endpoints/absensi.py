from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.siswa import Siswa
from app.schemas.absensi import AbsensiCreate, AbsensiResponse
from app.crud import absensi as crud_absensi

router = APIRouter()

@router.get("/", response_model=List[AbsensiResponse])
async def read_absensi_list(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    return crud_absensi.get_absensi_list(db, skip=skip, limit=limit)

@router.get("/guru/{guru_id}", response_model=List[AbsensiResponse])
async def read_absensi_by_guru(
    guru_id: int,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    guru = db.query(Guru).filter(Guru.id == guru_id).first()
    if not guru:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data guru tidak ditemukan"
        )
    if current_user.role in [UserRole.admin, UserRole.owner]:
        pass
    elif current_user.role == UserRole.guru and current_user.uid_terhubung == guru.uid:
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki akses ke log absensi guru ini"
        )
    return crud_absensi.get_absensi_by_guru(db, uid=guru.uid, skip=skip, limit=limit)

@router.get("/siswa/{siswa_id}", response_model=List[AbsensiResponse])
async def read_absensi_by_siswa(
    siswa_id: int,
    skip: int = 0,
    limit: int = 10,
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
            detail="Anda tidak memiliki akses ke log absensi siswa ini"
        )
    return crud_absensi.get_absensi_by_siswa(db, uid=siswa.uid, skip=skip, limit=limit)

from datetime import date, timedelta
from app.models.absensi_log import StatusAbsensi
from app.models.siswa import StatusSPP
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran

@router.post("/", response_model=AbsensiResponse, status_code=status.HTTP_201_CREATED)
async def create_new_absensi_log(
    absensi_in: AbsensiCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    # 1. Create the attendance log
    log = crud_absensi.create_absensi(db, absensi=absensi_in)

    # 2. Check if this UID belongs to a student
    siswa = db.query(Siswa).filter(Siswa.uid == absensi_in.uid.upper().strip(), Siswa.is_deleted == False).first()
    if siswa and absensi_in.status == StatusAbsensi.HADIR:
        # Decrement sisa_pertemuan by 1
        siswa.sisa_pertemuan = max(0, siswa.sisa_pertemuan - 1)
        db.add(siswa)
        
        # If sisa_pertemuan becomes 0, trigger expiration and billing
        if siswa.sisa_pertemuan == 0:
            siswa.status_spp = StatusSPP.EXPIRED
            db.add(siswa)
            
            # Create new pembayaran_periode record
            current_month = date.today().strftime("%Y-%m")
            due_date = date.today() + timedelta(days=7)
            billing = PembayaranPeriode(
                id_siswa=siswa.id,
                periode_bulan=current_month,
                jumlah=150000.00,
                status=StatusPembayaran.MENUNGGAK,
                due_date=due_date
            )
            db.add(billing)
        
        db.commit()

    return log
