import os
import uuid
import base64
import io
import logging
from typing import List, Optional
from datetime import datetime
from PIL import Image
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.galeri import Galeri

logger = logging.getLogger(__name__)
router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])
owner_only = RoleChecker([UserRole.owner])

class GaleriCreate(BaseModel):
    judul: str
    file_path: str
    deskripsi: Optional[str] = None

class GaleriResponse(BaseModel):
    id: int
    judul: str
    file_path: str
    deskripsi: Optional[str] = None
    is_highlighted: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

def save_base64_or_image_to_disk(base64_data_or_bytes: bytes, filename_prefix: str = "galeri") -> str:
    """Helper to save image bytes/base64 to backend/app/uploads/galeri/ as WebP with size & format validation"""
    # Max 5MB limit
    if len(base64_data_or_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Ukuran file terlalu besar. Maksimal 5MB."
        )
    
    upload_dir = os.path.join(os.path.dirname(__file__), "../../../uploads/galeri")
    os.makedirs(upload_dir, exist_ok=True)
    
    unique_id = uuid.uuid4().hex[:10]
    filename = f"{filename_prefix}_{unique_id}.webp"
    filepath = os.path.join(upload_dir, filename)
    
    try:
        image = Image.open(io.BytesIO(base64_data_or_bytes))
        # Validate format is acceptable image
        if image.format not in ("JPEG", "JPG", "PNG", "WEBP", "MPO"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format file tidak didukung. Harap upload gambar JPEG, PNG, atau WebP."
            )
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        image.save(filepath, "WEBP", quality=85)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File yang diunggah rusak atau bukan file gambar yang valid."
        )
    return f"/uploads/galeri/{filename}"

@router.get("/", response_model=List[GaleriResponse])
async def list_galeri(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(Galeri).order_by(Galeri.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/highlighted", response_model=List[GaleriResponse])
async def get_highlighted_galeri(
    db: Session = Depends(get_db)
):
    """
    Public endpoint: Get up to 4 highlighted/sorot gallery photos for homepage display.
    """
    return db.query(Galeri).filter(Galeri.is_highlighted == True).order_by(Galeri.created_at.desc()).limit(4).all()

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
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Gagal memproses file upload galeri: {e}", exc_info=True)
        if settings.fastapi_env == "production":
            raise HTTPException(status_code=500, detail="Terjadi kesalahan internal server saat mengunggah foto.")
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
    file_path = galeri_in.file_path.strip()

    # TASK 1.9: File Path Validation - Cegah arbitrary file path
    if not file_path.startswith("data:image/") and not file_path.startswith("/uploads/"):
        raise HTTPException(status_code=400, detail="Path file tidak valid. Harus diawali dengan /uploads/ atau data:image/")
    
    # If client passed base64 data URL, decode and save to file disk!
    if file_path.startswith("data:image/"):
        try:
            # format: data:image/webp;base64,...
            header, encoded = file_path.split(",", 1)
            decoded_bytes = base64.b64decode(encoded)
            file_path = save_base64_or_image_to_disk(decoded_bytes, filename_prefix="galeri")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Gagal memproses data gambar base64 galeri: {e}", exc_info=True)
            if settings.fastapi_env == "production":
                raise HTTPException(status_code=400, detail="Format data gambar base64 tidak valid.")
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
    current_user: User = Depends(owner_only)
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

@router.patch("/{id}/highlight", response_model=GaleriResponse)
async def toggle_highlight_galeri(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Toggle sorot/highlight pada foto galeri. Maksimal 4 foto yang bisa disorot.
    """
    item = db.query(Galeri).filter(Galeri.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Foto galeri tidak ditemukan")

    if not item.is_highlighted:
        # Check current highlighted count
        highlighted_count = db.query(Galeri).filter(Galeri.is_highlighted == True).count()
        if highlighted_count >= 4:
            raise HTTPException(
                status_code=400,
                detail="Maksimal 4 foto yang bisa disorot. Hapus sorotan foto lain terlebih dahulu."
            )
        item.is_highlighted = True
    else:
        item.is_highlighted = False

    db.commit()
    db.refresh(item)
    return item


@router.post("/export-sheets")
async def export_galeri_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    items = db.query(Galeri).all()
    rows = [["Judul", "Deskripsi", "Tanggal Dibuat", "Tautan Foto"]]
    for g in items:
        full_url = f"https://sempoasippariaman.com{g.file_path}" if g.file_path.startswith("/") else g.file_path
        # Karena Google Sheets user menggunakan Bahasa Indonesia, pemisah rumus adalah titik koma (;) bukan koma (,)
        hyperlink_formula = f'=HYPERLINK("{full_url}"; "Lihat Foto")'
        
        rows.append([
            g.judul,
            g.deskripsi or "-",
            g.created_at.strftime("%Y-%m-%d %H:%M") if g.created_at else "-",
            hyperlink_formula
        ])

    from app.services.google_sheets import send_to_google_sheet
    
    tab_name = "Galeri"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Data Galeri Foto")
