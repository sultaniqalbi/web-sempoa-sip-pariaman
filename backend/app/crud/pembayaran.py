from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.schemas.pembayaran import PembayaranCreate

def get_pembayaran(db: Session, pembayaran_id: int) -> Optional[PembayaranPeriode]:
    return db.query(PembayaranPeriode).filter(PembayaranPeriode.id == pembayaran_id).first()

def get_pembayaran_list(db: Session, skip: int = 0, limit: int = 10) -> List[PembayaranPeriode]:
    return db.query(PembayaranPeriode).offset(skip).limit(limit).all()

def get_pembayaran_by_siswa(db: Session, siswa_id: int) -> List[PembayaranPeriode]:
    return db.query(PembayaranPeriode).filter(PembayaranPeriode.id_siswa == siswa_id).all()

def create_pembayaran(db: Session, pembayaran: PembayaranCreate) -> PembayaranPeriode:
    db_pembayaran = PembayaranPeriode(
        id_siswa=pembayaran.id_siswa,
        periode_bulan=pembayaran.periode_bulan,
        jumlah=pembayaran.jumlah,
        status=pembayaran.status,
        due_date=pembayaran.due_date
    )
    db.add(db_pembayaran)
    db.commit()
    db.refresh(db_pembayaran)
    return db_pembayaran

def update_pembayaran_status(
    db: Session, db_pembayaran: PembayaranPeriode, status: StatusPembayaran
) -> PembayaranPeriode:
    db_pembayaran.status = status
    db.add(db_pembayaran)
    db.commit()
    db.refresh(db_pembayaran)
    return db_pembayaran
