from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class ProgramSetting(Base):
    __tablename__ = "program_settings"

    id = Column(Integer, primary_key=True, index=True)
    nama_program = Column(String(100), unique=True, nullable=False, index=True)
    biaya_spp = Column(Numeric(12, 2), nullable=False, default=200000.00)
    target_pertemuan = Column(Integer, nullable=False, default=12)
    jam_mulai = Column(String(20), nullable=True, default="08:00")
    jam_selesai = Column(String(20), nullable=True, default="12:00")
    hari_masuk = Column(String(255), nullable=True, default="Senin - Jumat")
    keterangan = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
