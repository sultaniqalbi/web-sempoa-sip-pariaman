import os
import uuid
import base64
import io
from typing import List, Optional
from datetime import datetime
from PIL import Image
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
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

def save_base64_or_image_to_disk(base64_data_or_bytes: bytes, filename_prefix: str = "galeri") -> str:
    """Helper to save image bytes/base64 to backend/app/uploads/galeri/ as WebP"""
    upload_dir = os.path.join(os.path.dirname(__file__), "../../../uploads/galeri")
    os.makedirs(upload_dir, exist_ok=True)
    
    unique_id = uuid.uuid4().hex[:10]
    filename = f"{filename_prefix}_{unique_id}.webp"
    filepath = os.path.join(upload_dir, filename)
    
    image = Image.open(io.BytesIO(base64_data_or_bytes))
    if image.mode in ("RGBA", "P"):
        # Keep RGBA or convert RGB depending on format
        pass
    image.save(filepath, "WEBP", quality=85)
    return f"/uploads/galeri/{filename}"

@router.get("/", response_model=List[GaleriResponse])
async def list_galeri(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(Galeri).order_by(Galeri.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/upload", response_model=GaleriResponse, status_code=status.HTTP_201_CREATED)
async def upload_galeri_multipart(
    file: UploadFile = File(...),
    judul: str = Form(...),
    deskripsi: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Multipart upload for gallery photos with auto WebP conversion and disk storage.
    """
    try:
        contents = await file.read()
        file_url = save_base64_or_image_to_disk(contents, filename_prefix="galeri")
        
        new_item = Galeri(
            judul=judul.strip(),
            file_path=file_url,
            deskripsi=deskripsi.strip() if deskripsi else None
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal memproses file upload: {str(e)}")

@router.post("/", response_model=GaleriResponse, status_code=status.HTTP_201_CREATED)
async def create_galeri(
    galeri_in: GaleriCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    JSON creation endpoint. Supports base64 data URLs or direct file URLs.
    """
    file_path = galeri_in.file_path
    
    # If client passed base64 data URL, decode and save to file disk!
    if file_path.startswith("data:image/"):
        try:
            # format: data:image/webp;base64,...
            header, encoded = file_path.split(",", 1)
            decoded_bytes = base64.b64decode(encoded)
            file_path = save_base64_or_image_to_disk(decoded_bytes, filename_prefix="galeri")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Gagal memproses data gambar base64: {str(e)}")

    new_item = Galeri(
        judul=galeri_in.judul.strip(),
        file_path=file_path,
        deskripsi=galeri_in.deskripsi.strip() if galeri_in.deskripsi else None
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

    # Clean up local file if stored in /uploads/galeri/
    if item.file_path and item.file_path.startswith("/uploads/galeri/"):
        upload_dir = os.path.join(os.path.dirname(__file__), "../../../uploads/galeri")
        fname = os.path.basename(item.file_path)
        fpath = os.path.join(upload_dir, fname)
        if os.path.exists(fpath):
            try:
                os.remove(fpath)
            except Exception:
                pass

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
