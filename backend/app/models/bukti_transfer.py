from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class StatusBuktiTransfer(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class BuktiTransfer(Base):
    __tablename__ = "bukti_transfer"

    id = Column(Integer, primary_key=True, index=True)
    id_pembayaran = Column(Integer, ForeignKey("pembayaran_periode.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(255), nullable=False)
    status = Column(SQLEnum(StatusBuktiTransfer, name="bukti_status_enum"), nullable=False, default=StatusBuktiTransfer.pending)
    admin_note = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
