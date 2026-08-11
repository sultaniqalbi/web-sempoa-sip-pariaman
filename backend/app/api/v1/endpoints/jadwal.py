from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.schemas.jadwal import JadwalCreate, JadwalUpdate, JadwalResponse
from app.crud import jadwal as crud_jadwal

router = APIRouter()

@router.get("/", response_model=List[JadwalResponse])
async def read_jadwal_list(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_jadwal.get_jadwal_list(db, skip=skip, limit=limit)

@router.post("/", response_model=JadwalResponse, status_code=status.HTTP_201_CREATED)
async def create_new_jadwal(
    jadwal_in: JadwalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    return crud_jadwal.create_jadwal(db, jadwal=jadwal_in)

@router.put("/{id}", response_model=JadwalResponse)
async def update_existing_jadwal(
    id: int,
    jadwal_in: JadwalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    db_jadwal = crud_jadwal.get_jadwal(db, jadwal_id=id)
    if not db_jadwal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jadwal tidak ditemukan"
        )
    return crud_jadwal.update_jadwal(db, db_jadwal=db_jadwal, update_data=jadwal_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_jadwal(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    db_jadwal = crud_jadwal.get_jadwal(db, jadwal_id=id)
    if not db_jadwal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Jadwal tidak ditemukan"
        )
    crud_jadwal.delete_jadwal(db, db_jadwal=db_jadwal)
    return None
