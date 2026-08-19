import os
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.pembayaran_periode import PembayaranPeriode
from app.models.siswa import Siswa
from app.models.bukti_transfer import StatusBuktiTransfer
from app.schemas.bukti_transfer import BuktiTransferResponse
from app.crud import bukti_transfer as crud_bukti_transfer

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../uploads/bukti-transfer"))

@router.get("/", response_model=List[BuktiTransferResponse])
async def read_proofs_list(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    return crud_bukti_transfer.get_bukti_transfer_list(db, skip=skip, limit=limit)

@router.post("/", response_model=BuktiTransferResponse, status_code=status.HTTP_201_CREATED)
async def upload_proof(
    id_pembayaran: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ortu:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya Orang Tua yang dapat mengupload bukti transfer"
        )

    pembayaran = db.query(PembayaranPeriode).filter(PembayaranPeriode.id == id_pembayaran).first()
    if not pembayaran:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tagihan pembayaran tidak ditemukan"
        )
    
    siswa = db.query(Siswa).filter(Siswa.id == pembayaran.id_siswa).first()
    if not siswa or (str(siswa.id) != current_user.uid_terhubung and siswa.uid != current_user.uid_terhubung):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Anda tidak memiliki akses ke tagihan pembayaran siswa ini"
        )

    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format file tidak didukung. Harus JPEG atau PNG"
        )

    max_size = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ukuran file terlalu besar. Maksimal 5MB"
        )
    await file.seek(0)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_ext = ".png" if file.content_type == "image/png" else ".jpg"
    filename = f"{siswa.id}_{timestamp}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"Gagal menyimpan berkas bukti transfer: {e}", exc_info=True)
        if settings.fastapi_env == "production":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Terjadi kesalahan internal server saat menyimpan berkas."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menyimpan berkas di server: {e}"
        )

    relative_path = f"uploads/bukti-transfer/{filename}"
    return crud_bukti_transfer.create_bukti_transfer(db, id_pembayaran=id_pembayaran, file_path=relative_path)

@router.put("/{id}", response_model=BuktiTransferResponse)
async def verify_proof(
    id: int,
    status_str: StatusBuktiTransfer,
    admin_note: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    proof = crud_bukti_transfer.get_bukti_transfer(db, proof_id=id)
    if not proof:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bukti transfer tidak ditemukan"
        )
    
    if status_str == StatusBuktiTransfer.approved:
        return crud_bukti_transfer.approve_bukti_transfer(db, db_proof=proof)
    elif status_str == StatusBuktiTransfer.rejected:
        return crud_bukti_transfer.reject_bukti_transfer(db, db_proof=proof, admin_note=admin_note)
    
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Status verifikasi tidak valid"
    )
