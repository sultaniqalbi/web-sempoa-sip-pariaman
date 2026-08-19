from typing import List
from sqlalchemy.orm import Session
from app.models.absensi_log import AbsensiLog
from app.schemas.absensi import AbsensiCreate

def get_absensi_list(db: Session, skip: int = 0, limit: int = 10) -> List[AbsensiLog]:
    return db.query(AbsensiLog).order_by(AbsensiLog.waktu.desc()).offset(skip).limit(limit).all()

from sqlalchemy import func

def get_absensi_by_guru(db: Session, uid: str, skip: int = 0, limit: int = 10) -> List[AbsensiLog]:
    return db.query(AbsensiLog).filter(func.lower(AbsensiLog.uid) == uid.lower().strip()).order_by(AbsensiLog.waktu.desc()).offset(skip).limit(limit).all()

def get_absensi_by_siswa(db: Session, uid: str, skip: int = 0, limit: int = 10) -> List[AbsensiLog]:
    return db.query(AbsensiLog).filter(func.lower(AbsensiLog.uid) == uid.lower().strip()).order_by(AbsensiLog.waktu.desc()).offset(skip).limit(limit).all()

def create_absensi(db: Session, absensi: AbsensiCreate) -> AbsensiLog:
    db_log = AbsensiLog(
        uid=absensi.uid.upper().strip(),
        waktu=absensi.waktu,
        mode=absensi.mode,
        status=absensi.status
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
