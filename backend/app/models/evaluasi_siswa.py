from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class EvaluasiSiswa(Base):
    __tablename__ = "evaluasi_siswa"

    id = Column(Integer, primary_key=True, index=True)
    id_siswa = Column(Integer, ForeignKey("siswa.id", ondelete="CASCADE"), nullable=False, index=True)
    id_guru = Column(Integer, ForeignKey("guru.id", ondelete="SET NULL"), nullable=True, index=True)
    kategori_program = Column(String(100), nullable=False)
    tanggal_evaluasi = Column(Date, nullable=False, server_default=func.current_date())
    periode_evaluasi = Column(String(100), nullable=True)
    
    # 4 Rating Aspek: Sangat Baik / Baik / Cukup / Perlu Bimbingan
    nilai_fokus = Column(String(50), nullable=False, default="Baik")
    nilai_kecepatan = Column(String(50), nullable=False, default="Baik")
    nilai_ketelitian = Column(String(50), nullable=False, default="Baik")
    nilai_pemahaman = Column(String(50), nullable=False, default="Baik")
    
    predikat_keseluruhan = Column(String(50), nullable=False, default="Baik")
    catatan_guru = Column(Text, nullable=False)
    saran_untuk_ortu = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
