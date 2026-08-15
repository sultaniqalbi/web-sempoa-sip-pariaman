from sqlalchemy import Column, Integer, String, Text, DateTime, Date
from sqlalchemy.sql import func
from app.core.database import Base

class Guru(Base):
    __tablename__ = "guru"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String(50), unique=True, nullable=False, index=True)
    nama = Column(String(100), nullable=False)
    nama_panggilan = Column(String(100), nullable=True)
    tempat_lahir = Column(String(100), nullable=True)
    tanggal_lahir = Column(Date, nullable=True)
    umur = Column(Integer, nullable=True)
    asal_sekolah = Column(String(150), nullable=True)
    kategori_program = Column(String(50), nullable=False, default="Sempoa SIP")
    hari_wajib = Column(String(100), nullable=False)
    target_kehadiran = Column(Integer, nullable=False, default=12)
    whatsapp_guru = Column(String(20), nullable=True)
    alamat = Column(Text, nullable=True)
    riwayat_pendidikan = Column(Text, nullable=True)
    paket_pengajaran = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    foto_profil = Column(String(255), nullable=True)
    mode_kelas = Column(String(20), nullable=True, default="OFFLINE")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
