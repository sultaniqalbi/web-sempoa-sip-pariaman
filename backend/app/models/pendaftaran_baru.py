from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class StatusPendaftaran(str, enum.Enum):
    BARU = "BARU"
    DIHUBUNGI = "DIHUBUNGI"
    DITERIMA = "DITERIMA"

class PendaftaranBaru(Base):
    __tablename__ = "pendaftaran_baru"

    id = Column(Integer, primary_key=True, index=True)
    nama_ortu = Column(String(100), nullable=False)
    nama_anak = Column(String(100), nullable=False)
    umur_anak = Column(String(20), nullable=False)
    nomor_wa = Column(String(20), nullable=False)
    program_studi = Column(String(100), nullable=False)
    catatan = Column(Text, nullable=True)
    waktu_daftar = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    status = Column(SQLEnum(StatusPendaftaran, name="pendaftaran_status_enum"), nullable=False, default=StatusPendaftaran.BARU)
