from sqlalchemy import create_engine
from app.models.guru import Guru
from app.models.absensi_log import AbsensiLog
from app.core.database import SessionLocal

try:
    db = SessionLocal()
    gurus = db.query(Guru).all()
    print(f"\n--- DAFTAR GURU DI DATABASE (Total: {len(gurus)}) ---")
    for g in gurus:
        print(f"- ID: {g.id}, Nama: {g.nama}, UID: '{g.uid}', is_deleted: {g.is_deleted}")

    print(f"\n--- 5 LOG ABSENSI TERAKHIR ---")
    logs = db.query(AbsensiLog).order_by(AbsensiLog.id.desc()).limit(5).all()
    for l in logs:
        print(f"- ID: {l.id}, UID: '{l.uid}', Waktu: {l.waktu}, Status: {l.status}")

except Exception as e:
    print(f"Error: {e}")
