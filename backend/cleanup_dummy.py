from app.core.database import SessionLocal
from app.models.users import User
from app.models.siswa import Siswa
from app.models.guru import Guru
from app.models.absensi_log import AbsensiLog
from app.models.jadwal import Jadwal
from app.models.galeri import Galeri
from app.models.keuangan import Keuangan

db = SessionLocal()

def clean_dummy():
    try:
        print("Cleaning dummy data...")
        
        # 1. Delete AbsensiLog for GR-DUMMY and SW-DUMMY
        db.query(AbsensiLog).filter(AbsensiLog.uid.in_(["GR-DUMMY", "SW-DUMMY"])).delete(synchronize_session=False)

        # 2. Delete Jadwal where notes/nama might indicate dummy, or just linked to dummy Guru/Siswa
        # First get dummy IDs
        dummy_gurus = db.query(Guru).filter((Guru.uid == "GR-DUMMY") | (Guru.nama.ilike("%demo%"))).all()
        dummy_guru_ids = [g.id for g in dummy_gurus]
        
        dummy_siswas = db.query(Siswa).filter((Siswa.uid == "SW-DUMMY") | (Siswa.nama.ilike("%demo%"))).all()
        dummy_siswa_ids = [s.id for s in dummy_siswas]

        if dummy_guru_ids or dummy_siswa_ids:
            db.query(Jadwal).filter(
                (Jadwal.id_guru.in_(dummy_guru_ids)) | 
                (Jadwal.id_siswa.in_(dummy_siswa_ids))
            ).delete(synchronize_session=False)
            
        # 3. Delete Galeri, Keuangan with 'dummy' or 'demo'
        db.query(Galeri).filter(Galeri.judul.ilike("%dummy%")).delete(synchronize_session=False)
        db.query(Galeri).filter(Galeri.judul.ilike("%demo%")).delete(synchronize_session=False)
        db.query(Keuangan).filter(Keuangan.keterangan.ilike("%dummy%")).delete(synchronize_session=False)

        # 4. Delete Siswa and Guru
        db.query(Siswa).filter(Siswa.uid == "SW-DUMMY").delete(synchronize_session=False)
        db.query(Siswa).filter(Siswa.nama.ilike("%demo%")).delete(synchronize_session=False)
        db.query(Guru).filter(Guru.uid == "GR-DUMMY").delete(synchronize_session=False)
        db.query(Guru).filter(Guru.nama.ilike("%demo%")).delete(synchronize_session=False)

        # 5. Delete Users
        db.query(User).filter(User.email.ilike("%@demo.com%")).delete(synchronize_session=False)
        db.query(User).filter(User.nama.ilike("%demo%")).delete(synchronize_session=False)

        db.commit()
        print("All dummy accounts & data removed. Database cleaned for production.")
        
        # Verify
        siswa_count = db.query(Siswa).filter(Siswa.nama.ilike("%demo%")).count()
        guru_count = db.query(Guru).filter(Guru.nama.ilike("%demo%")).count()
        print(f"Remaining dummy Siswa: {siswa_count}")
        print(f"Remaining dummy Guru: {guru_count}")

    except Exception as e:
        db.rollback()
        print("Error cleaning up:", str(e))
    finally:
        db.close()

if __name__ == "__main__":
    clean_dummy()
