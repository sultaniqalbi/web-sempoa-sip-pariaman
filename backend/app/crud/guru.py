from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.guru import Guru
from app.schemas.guru import GuruCreate, GuruUpdate

def get_guru(db: Session, guru_id: int) -> Optional[Guru]:
    return db.query(Guru).filter(Guru.id == guru_id, Guru.is_deleted == False).first()

def get_guru_by_uid(db: Session, uid: str) -> Optional[Guru]:
    return db.query(Guru).filter(Guru.uid == uid.upper().strip(), Guru.is_deleted == False).first()

def get_guru_list(db: Session, skip: int = 0, limit: int = 10) -> List[Guru]:
    return db.query(Guru).filter(Guru.is_deleted == False).offset(skip).limit(limit).all()

def create_guru(db: Session, guru: GuruCreate) -> Guru:
    db_guru = Guru(
        uid=guru.uid.upper().strip(),
        nama=guru.nama,
        kategori_program=guru.kategori_program,
        hari_wajib=guru.hari_wajib,
        target_kehadiran=guru.target_kehadiran,
        bio=guru.bio,
        foto_profil=guru.foto_profil
    )
    db.add(db_guru)
    db.commit()
    db.refresh(db_guru)
    return db_guru

def update_guru(db: Session, db_guru: Guru, update_data: GuruUpdate) -> Guru:
    obj_data = update_data.model_dump(exclude_unset=True)
    if "uid" in obj_data:
        obj_data["uid"] = obj_data["uid"].upper().strip()
    for field in obj_data:
        setattr(db_guru, field, obj_data[field])
    db.add(db_guru)
    db.commit()
    db.refresh(db_guru)
    return db_guru

def delete_guru(db: Session, db_guru: Guru) -> None:
    db.delete(db_guru)
    db.commit()
