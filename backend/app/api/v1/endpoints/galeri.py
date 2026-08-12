import os
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.galeri import Galeri

router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

class GaleriCreate(BaseModel):
    judul: str
    file_path: str
    deskripsi: Optional[str] = None

class GaleriResponse(BaseModel):
    id: int
    judul: str
    file_path: str
    deskripsi: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[GaleriResponse])
async def list_galeri(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(Galeri).order_by(Galeri.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=GaleriResponse, status_code=status.HTTP_201_CREATED)
async def create_galeri(
    galeri_in: GaleriCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    new_item = Galeri(
        judul=galeri_in.judul,
        file_path=galeri_in.file_path,
        deskripsi=galeri_in.deskripsi
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.delete("/{id}")
async def delete_galeri(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    item = db.query(Galeri).filter(Galeri.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Foto galeri tidak ditemukan")

    db.delete(item)
    db.commit()
    return {"status": "success", "message": "Foto galeri berhasil dihapus"}

@router.post("/export-sheets")
async def export_galeri_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    items = db.query(Galeri).all()
    rows = [["ID", "Judul", "URL File Path", "Deskripsi", "Tanggal Dibuat"]]
    for g in items:
        rows.append([g.id, g.judul, g.file_path, g.deskripsi or "-", g.created_at.strftime("%Y-%m-%d %H:%M") if g.created_at else "-"])

    service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    tab_name = f"Galeri_{datetime.utcnow().strftime('%Y%m%d')}"

    if not service_account_json or not sheet_id or not os.path.exists(service_account_json):
        return {
            "status": "pending",
            "message": "Google Sheets belum dikonfigurasi.",
            "worksheet_name": tab_name,
            "rows_written": len(rows) - 1,
            "preview": rows[:5]
        }

    try:
        import gspread
        gc = gspread.service_account(filename=service_account_json)
        sh = gc.open_by_key(sheet_id)
        try:
            ws = sh.worksheet(tab_name)
            ws.clear()
        except Exception:
            ws = sh.add_worksheet(title=tab_name, rows=len(rows)+10, cols=10)
        ws.update("A1", rows)
        return {
            "status": "success",
            "sheet_url": f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit#gid={ws.id}",
            "worksheet_name": tab_name,
            "rows_written": len(rows) - 1,
            "sent_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gagal export ke Google Sheets: {str(e)}",
            "rows_written": len(rows) - 1
        }
