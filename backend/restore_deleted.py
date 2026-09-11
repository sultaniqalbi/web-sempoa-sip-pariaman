from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.guru import Guru
from app.models.siswa import Siswa
from app.core.config import settings
import sys

try:
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    print("Memulihkan Guru...")
    gurus = db.query(Guru).filter(Guru.is_deleted == True).all()
    count_guru = 0
    for g in gurus:
        g.is_deleted = False
        count_guru += 1

    print("Memulihkan Siswa...")
    siswas = db.query(Siswa).filter(Siswa.is_deleted == True).all()
    count_siswa = 0
    for s in siswas:
        s.is_deleted = False
        count_siswa += 1

    db.commit()
    print(f"Berhasil memulihkan {count_guru} Guru dan {count_siswa} Siswa.")
except Exception as e:
    print(f"Error: {e}")
