import os
import io
import uuid
import logging
from typing import List, Optional
from datetime import datetime
from PIL import Image
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.security import get_password_hash, generate_random_password, normalize_whatsapp_number
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.audit_log import AuditLog
from app.schemas.guru import GuruCreate, GuruUpdate, GuruResponse, GuruCreateResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])
owner_only = RoleChecker([UserRole.owner])

class GuruResetPasswordResponse(BaseModel):
    status: str
    email: str
    new_password_plaintext: Optional[str] = None

@router.get("/", response_model=List[GuruResponse])
async def read_guru_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Guru).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=GuruResponse)
async def read_guru(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        int_id = int(id)
        db_guru = db.query(Guru).filter((Guru.id == int_id) | (Guru.uid == id)).first()
    except (ValueError, TypeError):
        db_guru = db.query(Guru).filter(Guru.uid == str(id)).first()

    if not db_guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")
    return db_guru

@router.post("/", response_model=GuruCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_new_guru(
    guru_in: GuruCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Tambah Guru Baru + Auto-Provisioning Akun Login Guru + Assign RFID UID
    """
    existing_uid = db.query(Guru).filter(Guru.uid == guru_in.uid).first()
    if existing_uid:
        raise HTTPException(status_code=400, detail="UID RFID kartu guru sudah terdaftar")

    # Generate teacher email: [nama_guru_lowercase]@sempoasippariaman.com
    clean_prefix = "".join(c for c in guru_in.nama.lower().replace(" ", "") if c.isalnum())
    if not clean_prefix:
        clean_prefix = "guru"
        
    email_candidate = f"{clean_prefix}@sempoasippariaman.com"
    suffix = 1
    while db.query(User).filter(func.lower(User.email) == email_candidate.lower()).first():
        suffix += 1
        email_candidate = f"{clean_prefix}{suffix}@sempoasippariaman.com"

    plain_password = generate_random_password(10)
    hashed_password = get_password_hash(plain_password)
    normalized_wa = normalize_whatsapp_number(guru_in.whatsapp_guru or "")

    try:
        new_guru = Guru(
            uid=guru_in.uid,
            nama=guru_in.nama,
            nama_panggilan=guru_in.nama_panggilan,
            tempat_lahir=guru_in.tempat_lahir,
            tanggal_lahir=guru_in.tanggal_lahir,
            umur=guru_in.umur,
            asal_sekolah=guru_in.asal_sekolah,
            kategori_program=guru_in.kategori_program,
            hari_wajib=guru_in.hari_wajib,
            target_kehadiran=guru_in.target_kehadiran or 12,
            whatsapp_guru=normalized_wa,
            alamat=guru_in.alamat,
            riwayat_pendidikan=guru_in.riwayat_pendidikan,
            paket_pengajaran=guru_in.paket_pengajaran,
            bio=guru_in.bio,
            foto_profil=guru_in.foto_profil
        )
        db.add(new_guru)
        db.flush()

        # Auto-provision teacher login account
        user_guru = User(
            email=email_candidate,
            password=hashed_password,
            plain_password=plain_password,
            role=UserRole.guru,
            nama=guru_in.nama,
            uid_terhubung=str(new_guru.id)
        )
        db.add(user_guru)

        db.commit()
        db.refresh(new_guru)

        return GuruCreateResponse(
            guru=GuruResponse.model_validate(new_guru),
            guru_email=email_candidate,
            guru_password_plaintext=plain_password,
            whatsapp_number=normalized_wa
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Gagal menambah guru: {e}", exc_info=True)
        if settings.fastapi_env == "production":
            raise HTTPException(status_code=500, detail="Terjadi kesalahan internal server saat memproses data guru.")
        raise HTTPException(status_code=400, detail=f"Gagal menambah guru: {str(e)}")

@router.post("/{id}/upload-foto")
async def upload_foto_guru(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    guru = db.query(Guru).filter(Guru.id == id).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Guru tidak ditemukan")
        
    try:
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Ukuran foto melebihi batas maksimal (5MB).")
            
        image = Image.open(io.BytesIO(contents))
        if image.format not in ("JPEG", "JPG", "PNG", "WEBP", "MPO"):
            raise HTTPException(status_code=400, detail="Format file tidak didukung. Harap gunakan format JPG, PNG, atau WebP.")
            
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        max_size = (800, 800)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        filename = f"guru_{guru.uid}_{uuid.uuid4().hex[:8]}.webp"
        upload_dir = os.path.join(os.path.dirname(__file__), "../../../uploads/profil")
        os.makedirs(upload_dir, exist_ok=True)
        
        filepath = os.path.join(upload_dir, filename)
        image.save(filepath, "WEBP", quality=80)
        
        file_url = f"/uploads/profil/{filename}"
        
        if guru.foto_profil and guru.foto_profil.startswith("/uploads/profil/"):
            old_filename = os.path.basename(guru.foto_profil)
            old_filepath = os.path.join(upload_dir, old_filename)
            if os.path.exists(old_filepath):
                try:
                    os.remove(old_filepath)
                except Exception:
                    pass
                    
        guru.foto_profil = file_url
        
        user_guru = db.query(User).filter(User.role == UserRole.guru, User.uid_terhubung == str(id)).first()
        if user_guru:
            user_guru.foto_profil = file_url
            
        db.commit()
        db.refresh(guru)
        
        return {"status": "success", "file_url": file_url}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Gagal memproses unggahan foto guru: {e}", exc_info=True)
        if settings.fastapi_env == "production":
            raise HTTPException(status_code=500, detail="Terjadi kesalahan internal server saat memproses gambar.")
        raise HTTPException(status_code=400, detail=f"Gagal memproses unggahan foto: {str(e)}")

@router.put("/{id}", response_model=GuruResponse)
async def update_existing_guru(
    id: int,
    guru_in: GuruUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    db_guru = db.query(Guru).filter(Guru.id == id).first()
    if not db_guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    update_dict = guru_in.model_dump(exclude_unset=True)
    if "whatsapp_guru" in update_dict:
        update_dict["whatsapp_guru"] = normalize_whatsapp_number(update_dict["whatsapp_guru"])

    for key, value in update_dict.items():
        setattr(db_guru, key, value)

    if "nama" in update_dict:
        user_guru = db.query(User).filter(
            User.role == UserRole.guru,
            (User.uid_terhubung == str(id)) | (User.uid_terhubung == db_guru.uid) | (func.lower(User.nama) == func.lower(db_guru.nama))
        ).first()
        if user_guru:
            user_guru.nama = update_dict["nama"]

    db.commit()
    db.refresh(db_guru)
    return db_guru

@router.delete("/{id}")
async def delete_guru(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    db_guru = db.query(Guru).filter(Guru.id == id).first()
    if not db_guru:
        raise HTTPException(status_code=404, detail="Data guru tidak ditemukan")

    db.query(User).filter(
        User.role == UserRole.guru,
        (User.uid_terhubung == str(id)) | (User.uid_terhubung == db_guru.uid) | (func.lower(User.nama) == func.lower(db_guru.nama))
    ).delete()
    db.delete(db_guru)

    try:
        audit = AuditLog(
            action="DELETE_GURU",
            role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
            email=current_user.email,
            details={"guru_id": id, "guru_nama": db_guru.nama},
            status="SUCCESS"
        )
        db.add(audit)
    except Exception:
        pass

    db.commit()
    return {"status": "success", "message": "Guru dan akun terhubung berhasil dihapus"}

@router.post("/{id}/reset-password", response_model=GuruResetPasswordResponse)
async def reset_guru_password(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    db_guru = db.query(Guru).filter(Guru.id == id).first()
    if not db_guru:
        raise HTTPException(status_code=404, detail="Guru tidak ditemukan")

    user_guru = db.query(User).filter(
        User.role == UserRole.guru,
        (User.uid_terhubung == str(id)) | (User.uid_terhubung == db_guru.uid) | (func.lower(User.nama) == func.lower(db_guru.nama))
    ).first()

    new_pwd = generate_random_password(10)
    hashed_pwd = get_password_hash(new_pwd)

    if not user_guru:
        clean_prefix = "".join(c for c in db_guru.nama.lower().replace(" ", "") if c.isalnum()) or "guru"
        email_candidate = f"{clean_prefix}@sempoasippariaman.com"
        suffix = 1
        while db.query(User).filter(func.lower(User.email) == email_candidate.lower()).first():
            suffix += 1
            email_candidate = f"{clean_prefix}{suffix}@sempoasippariaman.com"

        user_guru = User(
            email=email_candidate,
            password=hashed_pwd,
            plain_password=new_pwd,
            role=UserRole.guru,
            nama=db_guru.nama,
            uid_terhubung=str(db_guru.id)
        )
        db.add(user_guru)
    else:
        user_guru.password = hashed_pwd
        user_guru.plain_password = new_pwd
        user_guru.uid_terhubung = str(db_guru.id)
        if not user_guru.nama:
            user_guru.nama = db_guru.nama

    try:
        audit = AuditLog(
            action="RESET_PASSWORD_GURU",
            role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
            email=current_user.email,
            details={"guru_id": id, "guru_email": user_guru.email},
            status="SUCCESS"
        )
        db.add(audit)
    except Exception:
        pass

    db.commit()

    return GuruResetPasswordResponse(
        status="success",
        email=user_guru.email,
        new_password_plaintext=new_pwd
    )

@router.post("/{id}/push-whatsapp")
async def push_whatsapp_guru(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    guru = db.query(Guru).filter(Guru.id == id).first()
    if not guru:
        raise HTTPException(status_code=404, detail="Guru tidak ditemukan")

    wa_num = guru.whatsapp_guru
    if not wa_num:
        raise HTTPException(status_code=400, detail="Nomor WhatsApp guru belum diisi")

    user_guru = db.query(User).filter(
        User.role == UserRole.guru,
        (User.uid_terhubung == str(id)) | (User.uid_terhubung == guru.uid) | (func.lower(User.nama) == func.lower(guru.nama))
    ).first()
    guru_email = user_guru.email if user_guru else f"guru_{guru.id}@sempoasippariaman.com"

    # Always remember and reuse the exact password. If legacy account doesn't have plain_password, initialize once and persist it.
    if user_guru:
        if not user_guru.plain_password:
            initial_pwd = generate_random_password(10)
            user_guru.password = get_password_hash(initial_pwd)
            user_guru.plain_password = initial_pwd
            db.commit()
        guru_sandi = user_guru.plain_password
    else:
        guru_sandi = "sempoa123"

    message_template = f"""Halo {guru.nama},

Pemberitahuan akses akun Pengajar di Sempoa SIP TC Pariaman:

- Email: {guru_email}
- Sandi: {guru_sandi}
- Portal: https://sempoasippariaman.com/login

---
Tim Sempoa SIP TC Pariaman"""

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_WHATSAPP_FROM")

    if not all([account_sid, auth_token, from_number]):
        return {
            "status": "pending",
            "message": "WhatsApp API belum dikonfigurasi. Kirim pesan ini manual:",
            "fallback_message": message_template,
            "whatsapp_number": wa_num
        }

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        client.messages.create(from_=from_number, body=message_template, to=f"whatsapp:+{wa_num}")
        return {
            "status": "success",
            "message": f"Pesan WhatsApp terkirim ke +{wa_num}",
            "whatsapp_number": wa_num,
            "sent_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gagal kirim WA: {str(e)}",
            "fallback_message": message_template,
            "whatsapp_number": wa_num
        }

@router.post("/export-sheets")
async def export_guru_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    from app.services.google_sheets import send_to_google_sheet

    guru_list = db.query(Guru).all()
    rows = [["UID (RFID)", "Nama Guru", "Kategori Program", "Hari Wajib Mengajar", "No WhatsApp"]]
    for g in guru_list:
        rows.append([g.uid or "-", g.nama, g.kategori_program or "-", g.hari_wajib or "-", g.whatsapp_guru or "-"])

    tab_name = "Data Guru"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Data Guru")

