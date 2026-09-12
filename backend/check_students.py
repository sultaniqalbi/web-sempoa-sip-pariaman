from app.models.siswa import Siswa
from app.core.database import SessionLocal

try:
    db = SessionLocal()
    students = db.query(Siswa).order_by(Siswa.id.desc()).limit(10).all()
    print(f"\n--- 10 SISWA TERAKHIR DI DATABASE ---")
    for s in students:
        print(f"ID: {s.id}, Nama: {s.nama}, Prog: {s.kategori_program}, Target: {s.target_pertemuan}, Sisa: {s.sisa_pertemuan}, Status: {s.status_spp}, KuotaJson: {s.kuota_program}")
except Exception as e:
    print(f"Error: {e}")
