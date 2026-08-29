from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class JadwalBase(BaseModel):
    id_guru: Optional[int] = None
    guru_ids: Optional[str] = None
    id_siswa: Optional[int] = None
    hari: str
    jam_mulai: Optional[str] = None
    jam_selesai: Optional[str] = None
    lokasi: str = "TC Pariaman"
    is_hari_libur: bool = False
    kategori_program: str = "Sempoa SIP"
    mode_kelas: str = "OFFLINE"

class JadwalCreate(JadwalBase):
    pass

class JadwalUpdate(BaseModel):
    id_guru: Optional[int] = None
    guru_ids: Optional[str] = None
    guru_names: Optional[str] = None
    id_siswa: Optional[int] = None
    hari: Optional[str] = None
    jam_mulai: Optional[str] = None
    jam_selesai: Optional[str] = None
    lokasi: Optional[str] = None
    is_hari_libur: Optional[bool] = None
    kategori_program: Optional[str] = None
    mode_kelas: Optional[str] = None

class GuruSimpleInfo(BaseModel):
    id: int
    nama: str
    hari_wajib: Optional[str] = None
    kategori_program: Optional[str] = None

class JadwalResponse(JadwalBase):
    id: int
    guru_names: Optional[str] = None
    teachers: Optional[list[GuruSimpleInfo]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
