from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class StatusBuku(str, enum.Enum):
    SEDANG_DIPELAJARI = "SEDANG_DIPELAJARI"
    SELESAI = "SELESAI"
    LANJUT_LEVEL = "LANJUT_LEVEL"

class BukuSiswa(Base):
    __tablename__ = "buku_siswa"

    id = Column(Integer, primary_key=True, index=True)
    id_siswa = Column(Integer, ForeignKey("siswa.id", ondelete="CASCADE"), nullable=False, index=True)
    kategori_program = Column(String(100), nullable=False)
    level_anak = Column(String(100), nullable=False)
    nomor_buku = Column(String(100), nullable=False)
    jenis_buku = Column(String(150), nullable=True)
    status_buku = Column(SQLEnum(StatusBuku, name="status_buku_enum"), nullable=False, default=StatusBuku.SEDANG_DIPELAJARI)
    tanggal_mulai = Column(Date, nullable=False, server_default=func.current_date())
    tanggal_selesai = Column(Date, nullable=True)
    catatan_progres = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
