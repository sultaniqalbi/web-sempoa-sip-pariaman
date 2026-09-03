from app.core.database import SessionLocal
from app.models.users import User, UserRole
from app.models.siswa import Siswa
from app.models.guru import Guru
from app.models.absensi_log import AbsensiLog
from app.models.jadwal import Jadwal
from app.models.pembayaran_periode import PembayaranPeriode
from app.models.bukti_transfer import BuktiTransfer
from app.models.catatan_pembelajaran import CatatanPembelajaran
from app.models.keuangan import Keuangan
from app.models.pendaftaran_baru import PendaftaranBaru
from app.models.audit_log import AuditLog
from app.models.push_subscription import PushSubscription
from app.seed_data import run_seed

def clean_dummy():
    db = SessionLocal()
    try:
        print("Cleaning all dummy and transaction data (preserving Admin & Owner)...")
        db.query(AbsensiLog).delete(synchronize_session=False)
        db.query(CatatanPembelajaran).delete(synchronize_session=False)
        db.query(BuktiTransfer).delete(synchronize_session=False)
        db.query(PembayaranPeriode).delete(synchronize_session=False)
        db.query(Keuangan).delete(synchronize_session=False)
        db.query(Jadwal).delete(synchronize_session=False)
        db.query(PendaftaranBaru).delete(synchronize_session=False)
        db.query(AuditLog).delete(synchronize_session=False)
        db.query(PushSubscription).delete(synchronize_session=False)
        db.query(Siswa).delete(synchronize_session=False)
        db.query(Guru).delete(synchronize_session=False)
        db.query(User).filter(~User.role.in_([UserRole.admin, UserRole.owner])).delete(synchronize_session=False)
        db.commit()

        run_seed(db)
        print("Database wiped clean for production. Admin & Owner accounts are active.")
    except Exception as e:
        db.rollback()
        print("Error cleaning up:", str(e))
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if "--force-wipe-confirm" not in sys.argv:
        print("ABORTED: Destructive wipe script. Pass '--force-wipe-confirm' to execute.")
        sys.exit(1)
    clean_dummy()
