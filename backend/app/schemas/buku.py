from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime
from app.models.buku_siswa import StatusBuku

class BukuSiswaBase(BaseModel):
    id_siswa: int
    kategori_program: str
    level_anak: str
    nomor_buku: str
    jenis_buku: Optional[str] = None
    status_buku: StatusBuku = StatusBuku.SEDANG_DIPELAJARI
    tanggal_mulai: date
    tanggal_selesai: Optional[date] = None
    catatan_progres: Optional[str] = None

class BukuSiswaCreate(BukuSiswaBase):
    pass

class BukuSiswaUpdate(BaseModel):
    kategori_program: Optional[str] = None
    level_anak: Optional[str] = None
    nomor_buku: Optional[str] = None
    jenis_buku: Optional[str] = None
    status_buku: Optional[StatusBuku] = None
    tanggal_mulai: Optional[date] = None
    tanggal_selesai: Optional[date] = None
    catatan_progres: Optional[str] = None

class BukuSiswaResponse(BukuSiswaBase):
    id: int
    created_at: datetime
    nama_siswa: Optional[str] = None
    uid_siswa: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
