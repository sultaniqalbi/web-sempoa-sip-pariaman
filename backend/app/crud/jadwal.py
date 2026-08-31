from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.jadwal import Jadwal
from app.schemas.jadwal import JadwalCreate, JadwalUpdate

def get_jadwal(db: Session, jadwal_id: int) -> Optional[Jadwal]:
    return db.query(Jadwal).filter(Jadwal.id == jadwal_id).first()

def get_jadwal_list(db: Session, skip: int = 0, limit: int = 10) -> List[Jadwal]:
    return db.query(Jadwal).offset(skip).limit(limit).all()

def create_jadwal(db: Session, jadwal: JadwalCreate) -> Jadwal:
    primary_guru_id = jadwal.id_guru
    guru_ids_str = jadwal.guru_ids
    if guru_ids_str and not primary_guru_id:
        first_id_part = [x.strip() for x in guru_ids_str.split(",") if x.strip()]
        if first_id_part and first_id_part[0].isdigit():
            primary_guru_id = int(first_id_part[0])
    elif primary_guru_id and not guru_ids_str:
        guru_ids_str = str(primary_guru_id)

    primary_siswa_id = jadwal.id_siswa
    siswa_ids_str = jadwal.siswa_ids
    if siswa_ids_str and not primary_siswa_id:
        first_s_part = [x.strip() for x in siswa_ids_str.split(",") if x.strip()]
        if first_s_part and first_s_part[0].isdigit():
            primary_siswa_id = int(first_s_part[0])
    elif primary_siswa_id and not siswa_ids_str:
        siswa_ids_str = str(primary_siswa_id)

    db_jadwal = Jadwal(
        id_guru=primary_guru_id,
        guru_ids=guru_ids_str,
        id_siswa=primary_siswa_id,
        siswa_ids=siswa_ids_str,
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
    if "guru_ids" in obj_data:
        guru_ids_str = obj_data["guru_ids"]
        if guru_ids_str and "id_guru" not in obj_data:
            first_id_part = [x.strip() for x in guru_ids_str.split(",") if x.strip()]
            if first_id_part and first_id_part[0].isdigit():
                obj_data["id_guru"] = int(first_id_part[0])
    if "siswa_ids" in obj_data:
        siswa_ids_str = obj_data["siswa_ids"]
        if siswa_ids_str and "id_siswa" not in obj_data:
            first_s_part = [x.strip() for x in siswa_ids_str.split(",") if x.strip()]
            if first_s_part and first_s_part[0].isdigit():
                obj_data["id_siswa"] = int(first_s_part[0])
    for field in obj_data:
        if hasattr(db_jadwal, field):
            setattr(db_jadwal, field, obj_data[field])
    db.add(db_jadwal)
    db.commit()
    db.refresh(db_jadwal)
    return db_jadwal

def delete_jadwal(db: Session, db_jadwal: Jadwal) -> None:
    db.delete(db_jadwal)
    db.commit()
