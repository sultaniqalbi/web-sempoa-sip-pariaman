from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from app.models.bukti_transfer import StatusBuktiTransfer

class BuktiTransferBase(BaseModel):
    id_pembayaran: int
    file_path: str
    status: StatusBuktiTransfer = StatusBuktiTransfer.pending
    admin_note: Optional[str] = None

class BuktiTransferCreate(BaseModel):
    id_pembayaran: int
    admin_note: Optional[str] = None

class BuktiTransferUpdate(BaseModel):
    status: StatusBuktiTransfer
    admin_note: Optional[str] = None

class BuktiTransferResponse(BuktiTransferBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
