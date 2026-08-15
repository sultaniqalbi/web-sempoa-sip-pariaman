from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class CatatanPembelajaran(Base):
    __tablename__ = "catatan_pembelajaran"

    id = Column(Integer, primary_key=True, index=True)
    id_guru = Column(Integer, ForeignKey("guru.id", ondelete="CASCADE"), nullable=True)
    kategori_program = Column(String(50), nullable=True)
    id_siswa = Column(Integer, ForeignKey("siswa.id", ondelete="CASCADE"), nullable=True)
    tanggal = Column(Date, nullable=False, server_default=func.current_date())
    catatan = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
