from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.jadwal import Jadwal
from app.schemas.jadwal import JadwalCreate, JadwalUpdate

def get_jadwal(db: Session, jadwal_id: int) -> Optional[Jadwal]:
    return db.query(Jadwal).filter(Jadwal.id == jadwal_id).first()

def get_jadwal_list(db: Session, skip: int = 0, limit: int = 10) -> List[Jadwal]:
    return db.query(Jadwal).offset(skip).limit(limit).all()

def create_jadwal(db: Session, jadwal: JadwalCreate) -> Jadwal:
    db_jadwal = Jadwal(
        id_guru=jadwal.id_guru,
        id_siswa=jadwal.id_siswa,
        hari=jadwal.hari,
        jam_mulai=jadwal.jam_mulai,
        jam_selesai=jadwal.jam_selesai,
        lokasi=jadwal.lokasi,
        is_hari_libur=jadwal.is_hari_libur,
        kategori_program=jadwal.kategori_program,
        mode_kelas=jadwal.mode_kelas
    )
    db.add(db_jadwal)
    db.commit()
    db.refresh(db_jadwal)
    return db_jadwal

def update_jadwal(db: Session, db_jadwal: Jadwal, update_data: JadwalUpdate) -> Jadwal:
    obj_data = update_data.model_dump(exclude_unset=True)
    for field in obj_data:
        setattr(db_jadwal, field, obj_data[field])
    db.add(db_jadwal)
    db.commit()
    db.refresh(db_jadwal)
    return db_jadwal

def delete_jadwal(db: Session, db_jadwal: Jadwal) -> None:
    db.delete(db_jadwal)
    db.commit()
