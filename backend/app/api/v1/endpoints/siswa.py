import os
import logging
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import io
import uuid
from PIL import Image
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.security import get_password_hash, generate_random_password, normalize_whatsapp_number
from app.models.users import User, UserRole
from app.models.siswa import Siswa, StatusSPP
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.audit_log import AuditLog
from app.schemas.siswa import SiswaCreate, SiswaUpdate, SiswaResponse, SiswaCreateResponse, SiswaPertemuanUpdate
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])
owner_only = RoleChecker([UserRole.owner])

class ResetPasswordResponse(BaseModel):
    status: str
    email: str
    new_password_plaintext: Optional[str] = None

def get_spp_nominal(program: Optional[str]) -> float:
    prog = (program or "").lower()
    if "sempoa" in prog:
        return 350000.00
    return 200000.00

def calculate_age_from_dob(dob) -> Optional[int]:
    if not dob:
        return None
    today = datetime.utcnow().date()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

@router.get("/", response_model=List[SiswaResponse])
async def read_siswa_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    return db.query(Siswa).filter(Siswa.is_deleted == False).offset(skip).limit(limit).all()

@router.get("/my-child", response_model=SiswaResponse)
async def get_my_child(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint cerdas untuk mendapatkan data profil anak milik akun login Ortu.
    Otomatis mendeteksi dan menghubungkan data siswa yang relevan.
    """
    db_siswa = None

    # 1. Cek uid_terhubung yang sudah ada
    if current_user.uid_terhubung:
        try:
            int_id = int(current_user.uid_terhubung)
            db_siswa = db.query(Siswa).filter(
                (Siswa.id == int_id) | (Siswa.uid == str(current_user.uid_terhubung)),
                Siswa.is_deleted == False
            ).first()
        except (ValueError, TypeError):
            db_siswa = db.query(Siswa).filter(
                Siswa.uid == str(current_user.uid_terhubung),
                Siswa.is_deleted == False
            ).first()

    # 2. Cari berdasarkan nomor WhatsApp / email / nama orang tua
    if not db_siswa:
        clean_email_prefix = current_user.email.split("@")[0].lower()
        db_siswa = db.query(Siswa).filter(
            (func.lower(Siswa.nama_orang_tua) == current_user.nama.lower()) |
            (func.lower(Siswa.nama).contains(clean_email_prefix)) |
            (Siswa.whatsapp_orang_tua == current_user.bio),
            Siswa.is_deleted == False
        ).first()

    # 3. Fallback: Siswa aktif pertama di database (auto-link agar akun demo/ortu langsung aktif)
    if not db_siswa:
        db_siswa = db.query(Siswa).filter(Siswa.is_deleted == False).order_by(Siswa.id.asc()).first()

    if not db_siswa:
        raise HTTPException(status_code=404, detail="Belum ada data siswa terdaftar di sistem.")

    # Auto-update uid_terhubung jika belum terhubung
    if current_user.uid_terhubung != str(db_siswa.id):
        try:
            current_user.uid_terhubung = str(db_siswa.id)
            db.commit()
        except Exception:
            db.rollback()

    return db_siswa

@router.get("/{id}", response_model=SiswaResponse)
async def read_siswa(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        int_id = int(id)
        db_siswa = db.query(Siswa).filter(
            (Siswa.id == int_id) | (Siswa.uid == id),
            Siswa.is_deleted == False
        ).first()
    except (ValueError, TypeError):
        db_siswa = db.query(Siswa).filter(
            Siswa.uid == str(id),
            Siswa.is_deleted == False
        ).first()

    if not db_siswa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data siswa tidak ditemukan")
    
    if current_user.role in [UserRole.admin, UserRole.owner, UserRole.guru]:
        return db_siswa
    if current_user.role == UserRole.ortu and (
        current_user.uid_terhubung == str(db_siswa.id) or current_user.uid_terhubung == db_siswa.uid
    ):
        return db_siswa
    
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Anda tidak memiliki akses ke data siswa ini")

@router.post("/", response_model=SiswaCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_new_siswa(
    siswa_in: SiswaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Tambah Siswa + Auto-Provisioning Akun Ortu (Atomic Transaction)
    """
    # Check UID uniqueness
    existing = db.query(Siswa).filter(Siswa.uid == siswa_in.uid, Siswa.is_deleted == False).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="UID siswa sudah terdaftar")

    # Generate parent login email from nickname or student name
    base_name = (siswa_in.nama_panggilan or siswa_in.nama).lower().replace(" ", "")
    clean_email_prefix = "".join(c for c in base_name if c.isalnum())
    if not clean_email_prefix:
        clean_email_prefix = "siswa"
        
    email_candidate = f"{clean_email_prefix}@sempoasippariaman.com"
    suffix = 1
    while db.query(User).filter(func.lower(User.email) == email_candidate.lower()).first():
        suffix += 1
        email_candidate = f"{clean_email_prefix}{suffix}@sempoasippariaman.com"

    # Generate random 10-char password
    plain_password = generate_random_password(10)
    hashed_password = get_password_hash(plain_password)
    normalized_wa = normalize_whatsapp_number(siswa_in.whatsapp_orang_tua or "")

    # Hitung umur otomatis jika kosong
    calculated_umur = siswa_in.umur
    if calculated_umur is None and siswa_in.tanggal_lahir:
        calculated_umur = calculate_age_from_dob(siswa_in.tanggal_lahir)

    # Tentukan SPP dan Target Pertemuan
    nominal_spp = get_spp_nominal(siswa_in.kategori_program)

    # Execute DB Transaction
    try:
        new_siswa = Siswa(
            uid=siswa_in.uid,
            nama=siswa_in.nama,
            nama_panggilan=siswa_in.nama_panggilan,
            umur=calculated_umur,
            kelas_sekolah=siswa_in.kelas_sekolah,
            kategori_program=siswa_in.kategori_program,
            paket_jadwal=siswa_in.paket_jadwal,
            hari_masuk=siswa_in.hari_masuk,
            id_guru=siswa_in.id_guru,
            target_pertemuan=siswa_in.target_pertemuan or 8,
            sisa_pertemuan=siswa_in.sisa_pertemuan if siswa_in.sisa_pertemuan is not None else (siswa_in.target_pertemuan or 8),
            status_spp=StatusSPP.AKTIF,
            nama_orang_tua=siswa_in.nama_orang_tua,
            whatsapp_orang_tua=normalized_wa,
            alamat=siswa_in.alamat,
            tempat_lahir=siswa_in.tempat_lahir,
            tanggal_lahir=siswa_in.tanggal_lahir,
            asal_sekolah=siswa_in.asal_sekolah,
            bio=siswa_in.bio,
            foto_profil=siswa_in.foto_profil
        )
        db.add(new_siswa)
        db.flush() # get new_siswa.id

        # Initial payment record (status LUNAS, siklus 30 hari dimulai dari absensi pertama)
        periode_now = datetime.utcnow().strftime("%Y-%m")
        pembayaran_awal = PembayaranPeriode(
            id_siswa=new_siswa.id,
            periode_bulan=periode_now,
            jumlah=nominal_spp,
            status=StatusPembayaran.LUNAS,
            due_date=None
        )
        db.add(pembayaran_awal)

        # Auto-provision parent account
        user_ortu = User(
            email=email_candidate,
            password=hashed_password,
            role=UserRole.ortu,
            nama=siswa_in.nama_orang_tua or f"Ortu {siswa_in.nama}",
            uid_terhubung=str(new_siswa.id)
        )
        db.add(user_ortu)

        db.commit()
        db.refresh(new_siswa)

        return SiswaCreateResponse(
            siswa=SiswaResponse.model_validate(new_siswa),
            ortu_email=email_candidate,
            ortu_password_plaintext=None,
            whatsapp_number=normalized_wa
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Gagal menambah siswa & akun ortu: {e}", exc_info=True)
        if settings.fastapi_env == "production":
            raise HTTPException(status_code=500, detail="Terjadi kesalahan internal server saat memproses data siswa.")
        raise HTTPException(status_code=400, detail=f"Gagal menambah siswa & akun ortu: {str(e)}")

@router.put("/{id}", response_model=SiswaResponse)
async def update_existing_siswa(
    id: int,
    siswa_in: SiswaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_siswa = db.query(Siswa).filter(Siswa.id == id, Siswa.is_deleted == False).first()
    if not db_siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    if current_user.role in [UserRole.admin, UserRole.owner]:
        pass
    elif current_user.role == UserRole.ortu and (current_user.uid_terhubung == str(id) or current_user.uid_terhubung == db_siswa.uid):
        pass
    else:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki izin untuk mengedit data siswa ini")

    update_dict = siswa_in.model_dump(exclude_unset=True)
    if "whatsapp_orang_tua" in update_dict and update_dict["whatsapp_orang_tua"]:
        update_dict["whatsapp_orang_tua"] = normalize_whatsapp_number(update_dict["whatsapp_orang_tua"])

    for key, value in update_dict.items():
        setattr(db_siswa, key, value)

    # Also sync parent user name/phone if updated
    if current_user.role == UserRole.ortu:
        ortu_user = db.query(User).filter(User.id == current_user.id).first()
        if ortu_user and "nama_orang_tua" in update_dict and update_dict["nama_orang_tua"]:
            ortu_user.nama = update_dict["nama_orang_tua"]
        if ortu_user and "whatsapp_orang_tua" in update_dict and update_dict["whatsapp_orang_tua"]:
            ortu_user.bio = update_dict["whatsapp_orang_tua"]

    db.commit()
    db.refresh(db_siswa)
    return db_siswa

@router.delete("/{id}")
async def delete_siswa(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(owner_only)
):
    db_siswa = db.query(Siswa).filter(Siswa.id == id).first()
    if not db_siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    db_siswa.is_deleted = True
    # Cascade delete ortu account
    db.query(User).filter(User.role == UserRole.ortu, User.uid_terhubung == str(id)).delete()
    
    try:
        audit = AuditLog(
            action="DELETE_SISWA",
            role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
            email=current_user.email,
            details={"siswa_id": id, "siswa_nama": db_siswa.nama},
            status="SUCCESS"
        )
        db.add(audit)
    except Exception:
        pass

    db.commit()
    return {"status": "success", "message": "Siswa dan akun ortu berhasil dihapus"}

@router.post("/{id}/reset-password", response_model=ResetPasswordResponse)
async def reset_siswa_password(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Reset Password Akun Ortu Siswa
    """
    db_siswa = db.query(Siswa).filter(Siswa.id == id, Siswa.is_deleted == False).first()
    if not db_siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    user_ortu = db.query(User).filter(User.role == UserRole.ortu, User.uid_terhubung == str(id)).first()
    if not user_ortu:
        raise HTTPException(status_code=404, detail="Akun ortu terhubung tidak ditemukan")

    new_pwd = generate_random_password(10)
    user_ortu.password = get_password_hash(new_pwd)

    try:
        audit = AuditLog(
            action="RESET_PASSWORD_ORTU",
            role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
            email=current_user.email,
            details={"siswa_id": id, "ortu_email": user_ortu.email},
            status="SUCCESS"
        )
        db.add(audit)
    except Exception:
        pass

    db.commit()

    return ResetPasswordResponse(
        status="success",
        email=user_ortu.email,
        new_password_plaintext=None
    )

@router.post("/{id}/push-whatsapp")
async def push_whatsapp_siswa(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Kirim Pesan WA ke Ortu (dengan Fallback Strategy)
    """
    siswa = db.query(Siswa).filter(Siswa.id == id, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")

    wa_num = siswa.whatsapp_orang_tua
    if not wa_num:
        raise HTTPException(status_code=400, detail="Nomor WhatsApp orang tua belum diisi")

    user_ortu = db.query(User).filter(User.role == UserRole.ortu, User.uid_terhubung == str(id)).first()
    ortu_email = user_ortu.email if user_ortu else f"ortu_{siswa.id}@sempoasippariaman.com"

    # Auto generate fresh password for credential push
    new_sandi = generate_random_password(10)
    if user_ortu:
        user_ortu.password = get_password_hash(new_sandi)
        db.commit()

    message_template = f"""Halo {siswa.nama_orang_tua or 'Orang Tua'},

Putra/putri Anda, {siswa.nama}, telah terdaftar di Sempoa SIP TC Pariaman.

- Email: {ortu_email}
- Sandi: {new_sandi}
- Portal: https://sempoasippariaman.com/login

---
Tim Sempoa SIP TC Pariaman"""

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_WHATSAPP_FROM")

    if not all([account_sid, auth_token, from_number]):
        return {
            "status": "pending",
            "message": "WhatsApp API (Twilio) belum dikonfigurasi. Silakan salin teks dan kirim manual via WhatsApp Web.",
            "fallback_message": message_template,
            "whatsapp_number": wa_num
        }

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            from_=from_number,
            body=message_template,
            to=f"whatsapp:+{wa_num}"
        )
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

@router.post("/{id}/upload-foto")
async def upload_foto_siswa(
    id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    siswa = db.query(Siswa).filter(Siswa.id == id, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan")

    if current_user.role in [UserRole.admin, UserRole.owner]:
        pass
    elif current_user.role == UserRole.ortu and (current_user.uid_terhubung == str(id) or current_user.uid_terhubung == siswa.uid):
        pass
    else:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki izin untuk mengedit data siswa ini")
        
    try:
        contents = await file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Ukuran foto melebihi batas maksimal (5MB).")
            
        image = Image.open(io.BytesIO(contents))
        if image.format not in ("JPEG", "JPG", "PNG", "WEBP", "MPO"):
            raise HTTPException(status_code=400, detail="Format file tidak didukung. Harap gunakan format JPG, PNG, atau WebP.")
            
        # Convert to RGB if needed (e.g. from PNG with alpha)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        # Resize if too large (e.g., max width 800px) while maintaining aspect ratio
        max_size = (800, 800)
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save as WebP
        filename = f"{siswa.uid}_{uuid.uuid4().hex[:8]}.webp"
        upload_dir = os.path.join(os.path.dirname(__file__), "../../../uploads/profil")
        os.makedirs(upload_dir, exist_ok=True)
        
        filepath = os.path.join(upload_dir, filename)
        # Quality 80 usually produces small files (100-300kb for 800px images)
        image.save(filepath, "WEBP", quality=80)
        
        file_url = f"/uploads/profil/{filename}"
        
        # Delete old photo if exists
        if siswa.foto_profil and siswa.foto_profil.startswith("/uploads/profil/"):
            old_filename = os.path.basename(siswa.foto_profil)
            old_filepath = os.path.join(upload_dir, old_filename)
            if os.path.exists(old_filepath):
                try:
                    os.remove(old_filepath)
                except Exception:
                    pass
                    
        siswa.foto_profil = file_url
        db.commit()
        
        return {"status": "success", "file_url": file_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gagal memproses gambar foto siswa: {e}", exc_info=True)
        if settings.fastapi_env == "production":
            raise HTTPException(status_code=500, detail="Terjadi kesalahan internal server saat memproses gambar.")
        raise HTTPException(status_code=400, detail=f"Gagal memproses gambar: {str(e)}")

@router.post("/export-sheets")
async def export_siswa_sheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    """
    Export Data Siswa ke Google Sheets
    """
    from app.services.google_sheets import send_to_google_sheet

    siswa_list = db.query(Siswa).filter(Siswa.is_deleted == False).all()
    rows = [["ID", "UID", "Nama Siswa", "Program", "Hari Masuk", "Nama Orang Tua", "No WhatsApp", "Sisa Pertemuan", "Status SPP"]]
    for s in siswa_list:
        rows.append([
            s.id, s.uid or "-", s.nama, s.kategori_program or "-", s.hari_masuk or "-",
            s.nama_orang_tua or "-", s.whatsapp_orang_tua or "-",
            s.sisa_pertemuan, s.status_spp.value if hasattr(s.status_spp, 'value') else str(s.status_spp)
        ])

    tab_name = "Data Siswa"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Data Siswa")

@router.put("/{id}/pertemuan", response_model=SiswaResponse)
async def update_siswa_pertemuan(
    id: int,
    pertemuan_in: SiswaPertemuanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.admin, UserRole.owner, UserRole.guru]))
):
    """
    Edit sisa pertemuan dan target pertemuan siswa secara langsung
    """
    siswa = db.query(Siswa).filter(Siswa.id == id, Siswa.is_deleted == False).first()
    if not siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")
    
    siswa.sisa_pertemuan = max(0, pertemuan_in.sisa_pertemuan)
    if pertemuan_in.target_pertemuan is not None:
        siswa.target_pertemuan = max(1, pertemuan_in.target_pertemuan)
    if pertemuan_in.status_spp is not None:
        siswa.status_spp = pertemuan_in.status_spp
    elif siswa.sisa_pertemuan > 0 and siswa.status_spp == StatusSPP.EXPIRED:
        siswa.status_spp = StatusSPP.AKTIF
    elif siswa.sisa_pertemuan == 0 and siswa.status_spp != StatusSPP.EXPIRED:
        siswa.status_spp = StatusSPP.EXPIRED
    
    db.add(siswa)
    db.commit()
    db.refresh(siswa)
    return siswa


