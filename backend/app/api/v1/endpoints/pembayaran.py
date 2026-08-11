from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.siswa import Siswa
from app.schemas.pembayaran import PembayaranCreate, PembayaranResponse
from app.crud import pembayaran as crud_pembayaran

router = APIRouter()

@router.get("/", response_model=List[PembayaranResponse])
async def read_pembayaran_list(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in [UserRole.admin, UserRole.owner]:
        return crud_pembayaran.get_pembayaran_list(db, skip=skip, limit=limit)
    elif current_user.role == UserRole.ortu:
        if not current_user.uid_terhubung:
            return []
        siswa = db.query(Siswa).filter(Siswa.uid == current_user.uid_terhubung, Siswa.is_deleted == False).first()
        if not siswa:
            return []
        return db.query(PembayaranPeriode).filter(PembayaranPeriode.id_siswa == siswa.id).offset(skip).limit(limit).all()
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Role tidak diizinkan untuk melihat tagihan pembayaran"
    )

@router.get("/{id}", response_model=PembayaranResponse)
async def read_pembayaran(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pembayaran = crud_pembayaran.get_pembayaran(db, pembayaran_id=id)
    if not pembayaran:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tagihan pembayaran tidak ditemukan"
        )
    
    if current_user.role in [UserRole.admin, UserRole.owner]:
        return pembayaran
    
    if current_user.role == UserRole.ortu:
        siswa = db.query(Siswa).filter(Siswa.id == pembayaran.id_siswa).first()
        if siswa and siswa.uid == current_user.uid_terhubung:
            return pembayaran

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Anda tidak memiliki akses ke tagihan pembayaran ini"
    )

@router.get("/siswa/{siswa_id}", response_model=List[PembayaranResponse])
async def read_pembayaran_by_siswa(
    siswa_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role in [UserRole.admin, UserRole.owner]:
        return crud_pembayaran.get_pembayaran_by_siswa(db, siswa_id=siswa_id)

    if current_user.role == UserRole.ortu:
        siswa = db.query(Siswa).filter(Siswa.id == siswa_id).first()
        if siswa and siswa.uid == current_user.uid_terhubung:
            return crud_pembayaran.get_pembayaran_by_siswa(db, siswa_id=siswa_id)

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Anda tidak memiliki akses ke tagihan pembayaran siswa ini"
    )

@router.post("/", response_model=PembayaranResponse, status_code=status.HTTP_201_CREATED)
async def create_new_pembayaran(
    pembayaran_in: PembayaranCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    siswa = db.query(Siswa).filter(Siswa.id == pembayaran_in.id_siswa, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data siswa tidak ditemukan"
        )
    return crud_pembayaran.create_pembayaran(db, pembayaran=pembayaran_in)

@router.put("/{id}", response_model=PembayaranResponse)
async def update_payment_status_endpoint(
    id: int,
    status_str: StatusPembayaran,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    pembayaran = crud_pembayaran.get_pembayaran(db, pembayaran_id=id)
    if not pembayaran:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tagihan pembayaran tidak ditemukan"
        )
    return crud_pembayaran.update_pembayaran_status(db, db_pembayaran=pembayaran, status=status_str)
