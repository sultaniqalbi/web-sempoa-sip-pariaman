from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, Any
from datetime import datetime, date
from app.models.siswa import StatusSPP

class SiswaBase(BaseModel):
    uid: str
    nama: str
    nama_panggilan: Optional[str] = None
    umur: Optional[int] = None
    kelas_sekolah: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[date] = None
    asal_sekolah: Optional[str] = None
    kategori_program: str = "Sempoa SIP"
    paket_jadwal: Optional[str] = None
    hari_masuk: str = "Senin, Selasa, Rabu, Kamis, Jumat"
    id_guru: Optional[int] = None
    target_pertemuan: int = 8
    sisa_pertemuan: int = 8
    kuota_program: Optional[str] = None
    guru_per_program: Optional[str] = None
    status_spp: StatusSPP = StatusSPP.AKTIF
    nama_orang_tua: Optional[str] = None
    whatsapp_orang_tua: Optional[str] = None
    alamat: Optional[str] = None
    bio: Optional[str] = None
    foto_profil: Optional[str] = None
    buku_saat_ini: Optional[str] = None
    nomor_buku: Optional[str] = None
    tanggal_mulai_buku: Optional[date] = None

    @field_validator("tanggal_lahir", "tanggal_mulai_buku", mode="before")
    @classmethod
    def parse_tanggal_lahir(cls, v: Any) -> Optional[date]:
        if v == "" or v is None:
            return None
        if isinstance(v, str):
            try:
                return datetime.strptime(v.strip(), "%Y-%m-%d").date()
            except ValueError:
                return None
        return v

    @field_validator("umur", "id_guru", "target_pertemuan", "sisa_pertemuan", mode="before")
    @classmethod
    def parse_optional_int(cls, v: Any) -> Optional[int]:
        if v == "" or v is None:
            return None
        try:
            return int(v)
        except (ValueError, TypeError):
            return None

class SiswaCreate(SiswaBase):
    pass

class SiswaUpdate(BaseModel):
    uid: Optional[str] = None
    nama: Optional[str] = None
    nama_panggilan: Optional[str] = None
    umur: Optional[int] = None
    kelas_sekolah: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tanggal_lahir: Optional[date] = None
    asal_sekolah: Optional[str] = None
    kategori_program: Optional[str] = None
    paket_jadwal: Optional[str] = None
    hari_masuk: Optional[str] = None
    id_guru: Optional[int] = None
    target_pertemuan: Optional[int] = None
    sisa_pertemuan: Optional[int] = None
    kuota_program: Optional[str] = None
    guru_per_program: Optional[str] = None
    status_spp: Optional[StatusSPP] = None
    nama_orang_tua: Optional[str] = None
    whatsapp_orang_tua: Optional[str] = None
    alamat: Optional[str] = None
    bio: Optional[str] = None
    foto_profil: Optional[str] = None
    buku_saat_ini: Optional[str] = None
    nomor_buku: Optional[str] = None
    tanggal_mulai_buku: Optional[date] = None

    @field_validator("tanggal_lahir", "tanggal_mulai_buku", mode="before")
    @classmethod
    def parse_tanggal_lahir(cls, v: Any) -> Optional[date]:
        if v == "" or v is None:
            return None
        if isinstance(v, str):
            try:
                return datetime.strptime(v.strip(), "%Y-%m-%d").date()
            except ValueError:
                return None
        return v

    @field_validator("umur", "id_guru", "target_pertemuan", "sisa_pertemuan", mode="before")
    @classmethod
    def parse_optional_int(cls, v: Any) -> Optional[int]:
        if v == "" or v is None:
            return None
        try:
            return int(v)
        except (ValueError, TypeError):
            return None

class SiswaResponse(SiswaBase):
    id: int
    created_at: datetime
    is_deleted: bool
    
    model_config = ConfigDict(from_attributes=True)

class SiswaCreateResponse(BaseModel):
    siswa: SiswaResponse
    ortu_email: Optional[str] = None
    password_sent_via: Optional[str] = "whatsapp"
    ortu_password_plaintext: Optional[str] = None
    whatsapp_number: Optional[str] = None

class SiswaPertemuanUpdate(BaseModel):
    sisa_pertemuan: int
    target_pertemuan: Optional[int] = None
    status_spp: Optional[StatusSPP] = None
    catatan: Optional[str] = None
    kuota_program: Optional[str] = None

