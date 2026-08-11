from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.absensi_log import ModeAbsensi, StatusAbsensi

class AbsensiBase(BaseModel):
    uid: str
    waktu: datetime
    mode: ModeAbsensi = ModeAbsensi.ONLINE
    status: StatusAbsensi = StatusAbsensi.HADIR

class AbsensiCreate(AbsensiBase):
    pass

class AbsensiResponse(AbsensiBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
