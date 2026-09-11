from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.absensi_log import AbsensiLog
from app.core.database import SessionLocal
import sys

try:
    db = SessionLocal()

    total_logs = db.query(AbsensiLog).count()
    print(f"\n--- HASIL PEMERIKSAAN ABSENSI LOG ---")
    print(f"Total seluruh log absensi di database: {total_logs}")
    
    if total_logs > 0:
        logs = db.query(AbsensiLog).order_by(AbsensiLog.id.desc()).limit(5).all()
        print("\n5 Log Terakhir:")
        for log in logs:
            print(f"- ID: {log.id}, UID: {log.uid}, Waktu: {log.waktu}, Status: {log.status}, Role: {getattr(log, 'role', 'N/A')}")
    else:
        print("\nPERINGATAN: Tabel absensi_log KOSONG sama sekali!")
        
except Exception as e:
    print(f"Error: {e}")
