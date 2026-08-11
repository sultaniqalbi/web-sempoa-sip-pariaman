from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class JadwalBase(BaseModel):
    id_guru: Optional[int] = None
    id_siswa: Optional[int] = None
    hari: str
    jam_mulai: str
    jam_selesai: str
    lokasi: str = "TC Pariaman"

class JadwalCreate(JadwalBase):
    pass

class JadwalUpdate(BaseModel):
    id_guru: Optional[int] = None
    id_siswa: Optional[int] = None
    hari: Optional[str] = None
    jam_mulai: Optional[str] = None
    jam_selesai: Optional[str] = None
    lokasi: Optional[str] = None

class JadwalResponse(JadwalBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
