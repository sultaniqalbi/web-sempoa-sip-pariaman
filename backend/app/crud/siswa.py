from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.siswa import Siswa
from app.schemas.siswa import SiswaCreate, SiswaUpdate

def get_siswa(db: Session, siswa_id: int) -> Optional[Siswa]:
    return db.query(Siswa).filter(Siswa.id == siswa_id, Siswa.is_deleted == False).first()

def get_siswa_by_uid(db: Session, uid: str) -> Optional[Siswa]:
    return db.query(Siswa).filter(Siswa.uid == uid.upper().strip(), Siswa.is_deleted == False).first()

def get_siswa_list(db: Session, skip: int = 0, limit: int = 10) -> List[Siswa]:
    return db.query(Siswa).filter(Siswa.is_deleted == False).offset(skip).limit(limit).all()

def create_siswa(db: Session, siswa: SiswaCreate) -> Siswa:
    db_siswa = Siswa(
        uid=siswa.uid.upper().strip(),
        nama=siswa.nama,
        kategori_program=siswa.kategori_program,
        hari_masuk=siswa.hari_masuk,
        id_guru=siswa.id_guru,
        target_pertemuan=siswa.target_pertemuan,
        sisa_pertemuan=siswa.sisa_pertemuan,
        status_spp=siswa.status_spp,
        bio=siswa.bio,
        foto_profil=siswa.foto_profil
    )
    db.add(db_siswa)
    db.commit()
    db.refresh(db_siswa)
    return db_siswa

def update_siswa(db: Session, db_siswa: Siswa, update_data: SiswaUpdate) -> Siswa:
    obj_data = update_data.model_dump(exclude_unset=True)
    if "uid" in obj_data:
        obj_data["uid"] = obj_data["uid"].upper().strip()
    for field in obj_data:
        setattr(db_siswa, field, obj_data[field])
    db.add(db_siswa)
    db.commit()
    db.refresh(db_siswa)
    return db_siswa

def soft_delete_siswa(db: Session, db_siswa: Siswa) -> Siswa:
    db_siswa.is_deleted = True
    db.add(db_siswa)
    db.commit()
    db.refresh(db_siswa)
    return db_siswa
