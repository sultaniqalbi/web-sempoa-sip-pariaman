from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class StatusPembayaran(str, enum.Enum):
    MENUNGGAK = "MENUNGGAK"
    PENDING_VERIFIKASI = "PENDING_VERIFIKASI"
    LUNAS = "LUNAS"
    OVERDUE = "OVERDUE"

class PembayaranPeriode(Base):
    __tablename__ = "pembayaran_periode"

    id = Column(Integer, primary_key=True, index=True)
    id_siswa = Column(Integer, ForeignKey("siswa.id", ondelete="CASCADE"), nullable=False, index=True)
    periode_bulan = Column(String(20), nullable=False)
    jumlah = Column(Numeric(10, 2), nullable=False, default=0.00)
    status = Column(SQLEnum(StatusPembayaran, name="pembayaran_status_enum"), nullable=False, default=StatusPembayaran.MENUNGGAK)
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_pembayaran_siswa_status", "id_siswa", "status"),
    )
