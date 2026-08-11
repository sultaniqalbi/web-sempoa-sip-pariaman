from sqlalchemy import Column, Integer, String, Text, Numeric, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class JenisKeuangan(str, enum.Enum):
    PEMBAYARAN_SPP = "PEMBAYARAN_SPP"
    PENDAFTARAN = "PENDAFTARAN"
    PENGELUARAN = "PENGELUARAN"
    LAINNYA = "LAINNYA"

class Keuangan(Base):
    __tablename__ = "keuangan"

    id = Column(Integer, primary_key=True, index=True)
    id_siswa = Column(Integer, ForeignKey("siswa.id", ondelete="SET NULL"), nullable=True, index=True)
    jenis = Column(SQLEnum(JenisKeuangan, name="jenis_keuangan_enum"), nullable=False, default=JenisKeuangan.PEMBAYARAN_SPP)
    jumlah = Column(Numeric(10, 2), nullable=False, default=0.00)
    tanggal = Column(Date, nullable=False, server_default=func.current_date())
    keterangan = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
