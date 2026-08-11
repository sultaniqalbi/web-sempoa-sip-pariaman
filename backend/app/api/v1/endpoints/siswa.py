from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.schemas.siswa import SiswaCreate, SiswaUpdate, SiswaResponse
from app.crud import siswa as crud_siswa

router = APIRouter()

@router.get("/", response_model=List[SiswaResponse])
async def read_siswa_list(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    return crud_siswa.get_siswa_list(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=SiswaResponse)
async def read_siswa(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_siswa = crud_siswa.get_siswa(db, siswa_id=id)
    if not db_siswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data siswa tidak ditemukan"
        )
    if current_user.role in [UserRole.admin, UserRole.owner, UserRole.guru]:
        return db_siswa
    if current_user.role == UserRole.ortu and current_user.uid_terhubung == db_siswa.uid:
        return db_siswa
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Anda tidak memiliki akses ke data siswa ini"
    )

@router.post("/", response_model=SiswaResponse, status_code=status.HTTP_201_CREATED)
async def create_new_siswa(
    siswa_in: SiswaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    db_siswa = crud_siswa.get_siswa_by_uid(db, uid=siswa_in.uid)
    if db_siswa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="UID siswa sudah terdaftar"
        )
    return crud_siswa.create_siswa(db, siswa=siswa_in)

@router.put("/{id}", response_model=SiswaResponse)
async def update_existing_siswa(
    id: int,
    siswa_in: SiswaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    db_siswa = crud_siswa.get_siswa(db, siswa_id=id)
    if not db_siswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data siswa tidak ditemukan"
        )
    return crud_siswa.update_siswa(db, db_siswa=db_siswa, update_data=siswa_in)

@router.delete("/{id}", response_model=SiswaResponse)
async def delete_existing_siswa(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    db_siswa = crud_siswa.get_siswa(db, siswa_id=id)
    if not db_siswa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data siswa tidak ditemukan"
        )
    return crud_siswa.soft_delete_siswa(db, db_siswa=db_siswa)
