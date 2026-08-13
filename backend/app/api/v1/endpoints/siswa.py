import os
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.dependencies import get_current_user, RoleChecker
from app.core.security import get_password_hash, generate_random_password, normalize_whatsapp_number
from app.models.users import User, UserRole
from app.models.siswa import Siswa, StatusSPP
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.schemas.siswa import SiswaCreate, SiswaUpdate, SiswaResponse, SiswaCreateResponse
from pydantic import BaseModel

router = APIRouter()
admin_or_owner = RoleChecker([UserRole.admin, UserRole.owner])

class ResetPasswordResponse(BaseModel):
    status: str
    email: str
    new_password_plaintext: str

@router.get("/", response_model=List[SiswaResponse])
async def read_siswa_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    return db.query(Siswa).filter(Siswa.is_deleted == False).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=SiswaResponse)
async def read_siswa(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_siswa = db.query(Siswa).filter(Siswa.id == id, Siswa.is_deleted == False).first()
    if not db_siswa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data siswa tidak ditemukan")
    
    if current_user.role in [UserRole.admin, UserRole.owner, UserRole.guru]:
        return db_siswa
    if current_user.role == UserRole.ortu and current_user.uid_terhubung == str(db_siswa.id):
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

    # Execute DB Transaction
    try:
        new_siswa = Siswa(
            uid=siswa_in.uid,
            nama=siswa_in.nama,
            kategori_program=siswa_in.kategori_program,
            paket_jadwal=siswa_in.paket_jadwal,
            hari_masuk=siswa_in.hari_masuk,
            id_guru=siswa_in.id_guru,
            target_pertemuan=siswa_in.target_pertemuan or 8,
            sisa_pertemuan=8, # default 8 for new student
            status_spp=StatusSPP.AKTIF,
            nama_orang_tua=siswa_in.nama_orang_tua,
            whatsapp_orang_tua=normalized_wa,
            alamat=siswa_in.alamat,
            bio=siswa_in.bio,
            foto_profil=siswa_in.foto_profil
        )
        db.add(new_siswa)
        db.flush() # get new_siswa.id

        # Initial payment record (status LUNAS)
        periode_now = datetime.utcnow().strftime("%Y-%m")
        pembayaran_awal = PembayaranPeriode(
            id_siswa=new_siswa.id,
            periode_bulan=periode_now,
            jumlah=150000.00,
            status=StatusPembayaran.LUNAS
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
            ortu_password_plaintext=plain_password,
            whatsapp_number=normalized_wa
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Gagal menambah siswa & akun ortu: {str(e)}")

@router.put("/{id}", response_model=SiswaResponse)
async def update_existing_siswa(
    id: int,
    siswa_in: SiswaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    db_siswa = db.query(Siswa).filter(Siswa.id == id, Siswa.is_deleted == False).first()
    if not db_siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    update_dict = siswa_in.model_dump(exclude_unset=True)
    if "whatsapp_orang_tua" in update_dict:
        update_dict["whatsapp_orang_tua"] = normalize_whatsapp_number(update_dict["whatsapp_orang_tua"])

    for key, value in update_dict.items():
        setattr(db_siswa, key, value)

    db.commit()
    db.refresh(db_siswa)
    return db_siswa

@router.delete("/{id}")
async def delete_existing_siswa(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner)
):
    db_siswa = db.query(Siswa).filter(Siswa.id == id).first()
    if not db_siswa:
        raise HTTPException(status_code=404, detail="Data siswa tidak ditemukan")

    db_siswa.is_deleted = True
    # Cascade delete ortu account
    db.query(User).filter(User.role == UserRole.ortu, User.uid_terhubung == str(id)).delete()
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
    db.commit()

    return ResetPasswordResponse(
        status="success",
        email=user_ortu.email,
        new_password_plaintext=new_pwd
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

📧 Email: {ortu_email}
🔐 Sandi: {new_sandi}
🌐 Portal: https://sempoasippariaman.com/login

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

    tab_name = f"Siswa_{datetime.utcnow().strftime('%Y%m%d')}"
    return send_to_google_sheet(tab_name=tab_name, rows=rows, title="Data Siswa")

