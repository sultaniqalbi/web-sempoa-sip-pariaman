from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.schemas.guru import GuruCreate, GuruUpdate, GuruResponse
from app.crud import guru as crud_guru

router = APIRouter()

@router.get("/", response_model=List[GuruResponse])
async def read_guru_list(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    return crud_guru.get_guru_list(db, skip=skip, limit=limit)

@router.get("/{id}", response_model=GuruResponse)
async def read_guru(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_guru = crud_guru.get_guru(db, guru_id=id)
    if not db_guru:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data guru tidak ditemukan"
        )
    if current_user.role in [UserRole.admin, UserRole.owner]:
        return db_guru
    if current_user.role == UserRole.guru and current_user.uid_terhubung == db_guru.uid:
        return db_guru
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Anda tidak memiliki akses ke data guru ini"
    )

@router.post("/", response_model=GuruResponse, status_code=status.HTTP_201_CREATED)
async def create_new_guru(
    guru_in: GuruCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    db_guru = crud_guru.get_guru_by_uid(db, uid=guru_in.uid)
    if db_guru:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="UID guru sudah terdaftar"
        )
    return crud_guru.create_guru(db, guru=guru_in)

@router.put("/{id}", response_model=GuruResponse)
async def update_existing_guru(
    id: int,
    guru_in: GuruUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    db_guru = crud_guru.get_guru(db, guru_id=id)
    if not db_guru:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data guru tidak ditemukan"
        )
    return crud_guru.update_guru(db, db_guru=db_guru, update_data=guru_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_guru(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    db_guru = crud_guru.get_guru(db, guru_id=id)
    if not db_guru:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data guru tidak ditemukan"
        )
    crud_guru.delete_guru(db, db_guru=db_guru)
    return None
