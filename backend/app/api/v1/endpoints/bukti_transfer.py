import os
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.models.users import User, UserRole
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.siswa import Siswa
from app.models.bukti_transfer import StatusBuktiTransfer
from app.schemas.bukti_transfer import BuktiTransferResponse
from app.crud import bukti_transfer as crud_bukti_transfer

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../uploads/bukti-transfer"))

@router.get("/")
async def read_proofs_list(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner]))
):
    from app.models.bukti_transfer import BuktiTransfer
    proofs = db.query(BuktiTransfer).order_by(BuktiTransfer.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for pr in proofs:
        pay = db.query(PembayaranPeriode).filter(PembayaranPeriode.id == pr.id_pembayaran).first()
        siswa = db.query(Siswa).filter(Siswa.id == pay.id_siswa).first() if pay else None
        result.append({
            "id": pr.id,
            "id_pembayaran": pr.id_pembayaran,
            "file_path": pr.file_path,
            "status": pr.status.value if hasattr(pr.status, 'value') else str(pr.status),
            "admin_note": pr.admin_note,
            "created_at": pr.created_at.isoformat() if pr.created_at else None,
            "id_siswa": siswa.id if siswa else None,
            "nama_siswa": siswa.nama if siswa else "N/A",
            "kategori_program": siswa.kategori_program if siswa else "-",
            "whatsapp_orang_tua": siswa.whatsapp_orang_tua if siswa else "-",
            "nama_orang_tua": siswa.nama_orang_tua if siswa else "-",
            "periode_bulan": pay.periode_bulan if pay else "-",
            "jumlah": float(pay.jumlah) if pay else 0.0,
            "status_pembayaran": pay.status.value if (pay and hasattr(pay.status, 'value')) else (str(pay.status) if pay else "-")
        })
    return result

@router.get("/my-child")
async def read_my_child_proofs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ortu or not current_user.uid_terhubung:
        return []
    
    siswa = db.query(Siswa).filter(
        (Siswa.uid == current_user.uid_terhubung) | (Siswa.id == (int(current_user.uid_terhubung) if current_user.uid_terhubung.isdigit() else -1)),
        Siswa.is_deleted == False
    ).first()
    if not siswa:
        return []
    
    payments = db.query(PembayaranPeriode).filter(PembayaranPeriode.id_siswa == siswa.id).all()
    pay_ids = [p.id for p in payments]
    if not pay_ids:
        return []
    
    from app.models.bukti_transfer import BuktiTransfer
    proofs = db.query(BuktiTransfer).filter(BuktiTransfer.id_pembayaran.in_(pay_ids)).order_by(BuktiTransfer.created_at.desc()).all()
    
    result = []
    pay_map = {p.id: p for p in payments}
    for pr in proofs:
        pay = pay_map.get(pr.id_pembayaran)
        result.append({
            "id": pr.id,
            "id_pembayaran": pr.id_pembayaran,
            "file_path": pr.file_path,
            "status": pr.status.value if hasattr(pr.status, 'value') else str(pr.status),
            "admin_note": pr.admin_note,
            "created_at": pr.created_at.isoformat() if pr.created_at else None,
            "periode_bulan": pay.periode_bulan if pay else "-",
            "jumlah": float(pay.jumlah) if pay else 0.0,
            "status_pembayaran": pay.status.value if (pay and hasattr(pay.status, 'value')) else (str(pay.status) if pay else "-")
        })
    return result

@router.post("/", response_model=BuktiTransferResponse, status_code=status.HTTP_201_CREATED)
async def upload_proof(
    id_pembayaran: Optional[int] = Form(None),
    id_siswa: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.ortu, UserRole.admin, UserRole.owner]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya Orang Tua / Admin yang dapat mengupload bukti transfer"
        )

    # 1. Resolve Siswa
    siswa = None
    if id_siswa:
        siswa = db.query(Siswa).filter(Siswa.id == id_siswa, Siswa.is_deleted == False).first()
    elif current_user.uid_terhubung:
        siswa = db.query(Siswa).filter(
            (Siswa.uid == current_user.uid_terhubung) | (Siswa.id == (int(current_user.uid_terhubung) if current_user.uid_terhubung.isdigit() else -1)),
            Siswa.is_deleted == False
        ).first()

    # 2. Resolve Pembayaran
    pembayaran = None
    if id_pembayaran and id_pembayaran > 0:
        pembayaran = db.query(PembayaranPeriode).filter(PembayaranPeriode.id == id_pembayaran).first()
    
    if not pembayaran:
        if not siswa:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Data siswa tidak ditemukan untuk tagihan ini"
            )
        # Check existing bill or auto-create one
        pembayaran = db.query(PembayaranPeriode).filter(
            PembayaranPeriode.id_siswa == siswa.id
        ).order_by(PembayaranPeriode.created_at.desc()).first()

        if not pembayaran:
            is_sempoa = "sempoa" in (siswa.kategori_program or "").lower()
            nominal = 350000.0 if is_sempoa else 200000.0
            bulan_str = datetime.now().strftime("%B %Y")
            
            pembayaran = PembayaranPeriode(
                id_siswa=siswa.id,
                periode_bulan=bulan_str,
                jumlah=nominal,
                status=StatusPembayaran.PENDING_VERIFIKASI,
                due_date=(datetime.utcnow() + timedelta(days=30)).date()
            )
            db.add(pembayaran)
            db.commit()
            db.refresh(pembayaran)
    
    if not siswa:
        siswa = db.query(Siswa).filter(Siswa.id == pembayaran.id_siswa).first()

    if current_user.role == UserRole.ortu:
        if not siswa or (str(siswa.id) != current_user.uid_terhubung and siswa.uid != current_user.uid_terhubung):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak memiliki akses ke tagihan pembayaran siswa ini"
            )

    # Validate file extension and MIME type
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    valid_extensions = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]
    valid_content_types = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/heic", "image/heif", "application/octet-stream"]

    if file.content_type not in valid_content_types and file_ext not in valid_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format file tidak didukung. Harap unggah foto struk dalam format JPG, PNG, atau WEBP."
        )

    max_size = 10 * 1024 * 1024 # 10MB
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ukuran file terlalu besar. Maksimal 10MB"
        )
    await file.seek(0)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = file_ext if file_ext in [".png", ".jpg", ".jpeg", ".webp"] else ".jpg"
    filename = f"{siswa.id}_{timestamp}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"Gagal menyimpan berkas bukti transfer: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menyimpan berkas di server: {e}"
        )

    relative_path = f"uploads/bukti-transfer/{filename}"
    return crud_bukti_transfer.create_bukti_transfer(db, id_pembayaran=pembayaran.id, file_path=relative_path)

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
