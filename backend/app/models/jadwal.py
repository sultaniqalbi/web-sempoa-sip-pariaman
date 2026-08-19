from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class Jadwal(Base):
    __tablename__ = "jadwal"

    id = Column(Integer, primary_key=True, index=True)
    id_guru = Column(Integer, ForeignKey("guru.id", ondelete="CASCADE"), nullable=True, index=True)
    id_siswa = Column(Integer, ForeignKey("siswa.id", ondelete="CASCADE"), nullable=True, index=True)
    hari = Column(String(100), nullable=False)
    jam_mulai = Column(String(10), nullable=False)
    jam_selesai = Column(String(10), nullable=False)
    lokasi = Column(String(100), nullable=False, default="TC Pariaman")
    is_hari_libur = Column(Boolean, default=False, nullable=False)
    kategori_program = Column(String(50), nullable=False, default="Sempoa SIP")
    mode_kelas = Column(String(20), nullable=False, default="OFFLINE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
