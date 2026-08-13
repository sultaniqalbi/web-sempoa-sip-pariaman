import os
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.jadwal import Jadwal
from app.models.guru import Guru
from app.models.siswa import Siswa
from app.schemas.jadwal import JadwalCreate, JadwalUpdate, JadwalResponse
from app.crud import jadwal as crud_jadwal

router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

@router.get("/", response_model=List[JadwalResponse])
async def read_jadwal_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_jadwal.get_jadwal_list(db, skip=skip, limit=limit)

@router.post("/", response_model=JadwalResponse, status_code=status.HTTP_201_CREATED)
async def create_new_jadwal(
    jadwal_in: JadwalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    return crud_jadwal.create_jadwal(db, jadwal=jadwal_in)

@router.put("/{id}", response_model=JadwalResponse)
async def update_existing_jadwal(
    id: int,
    jadwal_in: JadwalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    db_jadwal = crud_jadwal.get_jadwal(db, jadwal_id=id)
    if not db_jadwal:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    return crud_jadwal.update_jadwal(db, db_jadwal=db_jadwal, update_data=jadwal_in)

@router.delete("/{id}")
async def delete_existing_jadwal(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    db_jadwal = crud_jadwal.get_jadwal(db, jadwal_id=id)
    if not db_jadwal:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    crud_jadwal.delete_jadwal(db, db_jadwal=db_jadwal)
    return {"status": "success", "message": "Jadwal berhasil dihapus"}

@router.post("/export-sheets")
async def export_jadwal_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    from app.services.google_sheets import send_to_google_sheet

    items = db.query(Jadwal).all()
    rows = [["ID Jadwal", "Hari", "Jam Mulai", "Jam Selesai", "ID Guru", "Nama Guru", "ID Siswa", "Nama Siswa", "Lokasi"]]
    for j in items:
        guru = db.query(Guru).filter(Guru.id == j.id_guru).first() if j.id_guru else None
        siswa = db.query(Siswa).filter(Siswa.id == j.id_siswa).first() if j.id_siswa else None
        rows.append([
            j.id, j.hari, j.jam_mulai, j.jam_selesai,
            j.id_guru or "-", guru.nama if guru else "-",
            j.id_siswa or "-", siswa.nama if siswa else "-",
            j.lokasi or "-"
        ])

    tab_name = f"Jadwal_{datetime.utcnow().strftime('%Y%m%d')}"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Jadwal Kelas Sempoa")

