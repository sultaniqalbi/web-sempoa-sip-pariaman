from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date
from app.models.siswa import StatusSPP

class SiswaBase(BaseModel):
    uid: str
    nama: str
    nama_panggilan: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[date] = None
    asal_sekolah: Optional[str] = None
    kategori_program: str
    paket_jadwal: Optional[str] = None
    hari_masuk: str
    id_guru: Optional[int] = None
    target_pertemuan: int = 8
    sisa_pertemuan: int = 8
    status_spp: StatusSPP = StatusSPP.AKTIF
    nama_orang_tua: Optional[str] = None
    whatsapp_orang_tua: Optional[str] = None
    alamat: Optional[str] = None
    bio: Optional[str] = None
    foto_profil: Optional[str] = None

class SiswaCreate(SiswaBase):
    pass

class SiswaUpdate(BaseModel):
    uid: Optional[str] = None
    nama: Optional[str] = None
    nama_panggilan: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[date] = None
    asal_sekolah: Optional[str] = None
    kategori_program: Optional[str] = None
    paket_jadwal: Optional[str] = None
    hari_masuk: Optional[str] = None
    id_guru: Optional[int] = None
    target_pertemuan: Optional[int] = None
    sisa_pertemuan: Optional[int] = None
    status_spp: Optional[StatusSPP] = None
    nama_orang_tua: Optional[str] = None
    whatsapp_orang_tua: Optional[str] = None
    alamat: Optional[str] = None
    bio: Optional[str] = None
    foto_profil: Optional[str] = None

class SiswaResponse(SiswaBase):
    id: int
    created_at: datetime
    is_deleted: bool
    
    model_config = ConfigDict(from_attributes=True)

class SiswaCreateResponse(BaseModel):
    siswa: SiswaResponse
    ortu_email: str
    ortu_password_plaintext: str
    whatsapp_number: Optional[str] = None
