from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date

class GuruBase(BaseModel):
    uid: str
    nama: str
    nama_panggilan: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[date] = None
    umur: Optional[int] = None
    asal_sekolah: Optional[str] = None
    kategori_program: str = "Sempoa SIP"
    hari_wajib: str
    target_kehadiran: int = 12
    whatsapp_guru: Optional[str] = None
    alamat: Optional[str] = None
    riwayat_pendidikan: Optional[str] = None
    paket_pengajaran: Optional[str] = None
    bio: Optional[str] = None
    foto_profil: Optional[str] = None

class GuruCreate(GuruBase):
    pass

class GuruUpdate(BaseModel):
    uid: Optional[str] = None
    nama: Optional[str] = None
    nama_panggilan: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[date] = None
    umur: Optional[int] = None
    asal_sekolah: Optional[str] = None
    kategori_program: Optional[str] = None
    hari_wajib: Optional[str] = None
    target_kehadiran: Optional[int] = None
    whatsapp_guru: Optional[str] = None
    alamat: Optional[str] = None
    riwayat_pendidikan: Optional[str] = None
    paket_pengajaran: Optional[str] = None
    bio: Optional[str] = None
    foto_profil: Optional[str] = None

class GuruResponse(GuruBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GuruCreateResponse(BaseModel):
    guru: GuruResponse
    guru_email: str
    guru_password_plaintext: str
    whatsapp_number: Optional[str] = None

