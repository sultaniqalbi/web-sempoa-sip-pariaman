from pydantic import BaseModel, ConfigDict
from typing import Optional
from decimal import Decimal
from datetime import date, datetime
from app.models.pembayaran_periode import StatusPembayaran

class PembayaranBase(BaseModel):
    id_siswa: int
    periode_bulan: str
    jumlah: Decimal
    status: StatusPembayaran = StatusPembayaran.MENUNGGAK
    due_date: Optional[date] = None

class PembayaranCreate(PembayaranBase):
    pass

class PembayaranUpdate(BaseModel):
    status: Optional[StatusPembayaran] = None
    jumlah: Optional[Decimal] = None
    due_date: Optional[date] = None

class PembayaranResponse(PembayaranBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PembayaranDueDateUpdate(BaseModel):
    due_date: Optional[date] = None
    status: Optional[StatusPembayaran] = None
    tambah_kuota: Optional[bool] = False
    jumlah: Optional[Decimal] = None
    catatan: Optional[str] = None

