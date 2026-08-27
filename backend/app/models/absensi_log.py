from sqlalchemy import Column, Integer, String, Text, DateTime, Index, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class ModeAbsensi(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"

class StatusAbsensi(str, enum.Enum):
    HADIR = "HADIR"
    IZIN = "IZIN"
    ALFA = "ALFA"
    TERLAMBAT = "TERLAMBAT"

class AbsensiLog(Base):
    __tablename__ = "absensi_log"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String(50), nullable=False)
    waktu = Column(DateTime(timezone=True), nullable=False)
    mode = Column(SQLEnum(ModeAbsensi, name="absensi_mode_enum"), nullable=False, default=ModeAbsensi.ONLINE)
    status = Column(SQLEnum(StatusAbsensi, name="absensi_status_enum"), nullable=False, default=StatusAbsensi.HADIR)
    catatan = Column(Text, nullable=True)
    sumber = Column(String(50), nullable=True, default="RFID")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_absensi_uid_waktu", "uid", "waktu"),
    )
