from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class StatusSPP(str, enum.Enum):
    AKTIF = "AKTIF"
    EXPIRED = "EXPIRED"

class Siswa(Base):
    __tablename__ = "siswa"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String(50), unique=True, nullable=False, index=True)
    nama = Column(String(100), nullable=False)
    kategori_program = Column(String(50), nullable=False)
    hari_masuk = Column(String(50), nullable=False)
    id_guru = Column(Integer, ForeignKey("guru.id", ondelete="SET NULL"), nullable=True, index=True)
    target_pertemuan = Column(Integer, nullable=False, default=8)
    sisa_pertemuan = Column(Integer, nullable=False, default=0)
    status_spp = Column(SQLEnum(StatusSPP, name="spp_status_enum"), nullable=False, default=StatusSPP.AKTIF)
    bio = Column(Text, nullable=True)
    foto_profil = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_deleted = Column(Boolean, default=False, nullable=False)
