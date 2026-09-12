from app.models.guru import Guru
from app.models.siswa import Siswa
from app.core.database import SessionLocal
from app.api.v1.endpoints.portal_guru import _get_matching_guru_ids, _get_guru_students
import json

db = SessionLocal()
try:
    print("=== CEK GURU REYSHA AMEILISTA ===")
    gurus = db.query(Guru).all()
    for g in gurus:
        print(f"Guru ID: {g.id}, Nama: {g.nama}, Panggilan: {g.nama_panggilan}, Program: {g.kategori_program}, UID: {g.uid}")

    reysha = db.query(Guru).filter(Guru.nama.ilike("%reysha%")).first()
    if reysha:
        matching_ids = _get_matching_guru_ids(db, reysha)
        print(f"\nReysha ID: {reysha.id}, Matching IDs: {matching_ids}")
        
        all_siswa = db.query(Siswa).filter(Siswa.is_deleted == False).all()
        print(f"Total Siswa Aktif: {len(all_siswa)}")
        
        assigned = _get_guru_students(db, reysha, matching_ids)
        print(f"Siswa ter-assign ke Reysha via _get_guru_students: {len(assigned)}")
        for s in assigned:
            print(f" - ID: {s.id}, Nama: {s.nama}, Program: {s.kategori_program}, id_guru: {s.id_guru}, gpp: {s.guru_per_program}")
            
        print("\nCek seluruh siswa dan id_guru / guru_per_program mereka:")
        for s in all_siswa:
            print(f"Siswa ID: {s.id}, Nama: {s.nama}, Prog: {s.kategori_program}, id_guru: {s.id_guru}, gpp: {s.guru_per_program}")
finally:
    db.close()
