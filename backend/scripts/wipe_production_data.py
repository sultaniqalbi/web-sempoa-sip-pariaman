import sys
import os
import json
import logging

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal, engine, Base
from app.models.users import User, UserRole
from app.models.guru import Guru
from app.models.siswa import Siswa
from app.models.jadwal import Jadwal
from app.models.absensi_log import AbsensiLog
from app.models.pembayaran_periode import PembayaranPeriode
from app.models.bukti_transfer import BuktiTransfer
from app.models.catatan_pembelajaran import CatatanPembelajaran
from app.models.keuangan import Keuangan
from app.models.pendaftaran_baru import PendaftaranBaru
from app.models.audit_log import AuditLog
from app.models.push_subscription import PushSubscription
from app.seed_data import run_seed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wipe_production_data")

def wipe_data():
    db = SessionLocal()
    try:
        print("==========================================================")
        print("🧹 MEMULAI PROSES PEMBERSIHAN DATA DATABASE SERVER")
        print("  - Menghapus semua data transaksi, siswa, guru, jadwal, absensi, pembayaran")
        print("  - MEMPERTAHANKAN: Akun Admin & Akun Direktur / Owner")
        print("  - MEMPERTAHANKAN: Seluruh file foto / gambar yang sudah diupload")
        print("==========================================================")

        # 1. Hapus Relasi Transaksional Terlebih Dahulu (Child Tables)
        deleted_absensi = db.query(AbsensiLog).delete(synchronize_session=False)
        deleted_catatan = db.query(CatatanPembelajaran).delete(synchronize_session=False)
        deleted_bukti = db.query(BuktiTransfer).delete(synchronize_session=False)
        deleted_pembayaran = db.query(PembayaranPeriode).delete(synchronize_session=False)
        deleted_keuangan = db.query(Keuangan).delete(synchronize_session=False)
        deleted_jadwal = db.query(Jadwal).delete(synchronize_session=False)
        deleted_pendaftaran = db.query(PendaftaranBaru).delete(synchronize_session=False)
        deleted_audit = db.query(AuditLog).delete(synchronize_session=False)
        deleted_push = db.query(PushSubscription).delete(synchronize_session=False)

        # 2. Hapus Master Siswa & Guru
        deleted_siswa = db.query(Siswa).delete(synchronize_session=False)
        deleted_guru = db.query(Guru).delete(synchronize_session=False)

        # 3. Hapus Akun User SELAIN Akun Resmi Produksi (Admin & Owner Utama)
        production_emails = [
            "0b11010f8c@sempoasippariaman.com",
            "0xa7f3b9e2@sempoasippariaman.com",
        ]
        deleted_users = db.query(User).filter(
            ~func.lower(User.email).in_(production_emails)
        ).delete(synchronize_session=False)

        db.commit()

        # 4. Pastikan Akun Admin & Direktur / Owner Produksi Tetap Siap & Aktif
        run_seed(db)

        # 5. Reset last_tap.json jika ada
        last_tap_paths = [
            os.path.join(os.path.dirname(__file__), "../last_tap.json"),
            os.path.join(os.path.dirname(__file__), "../../last_tap.json")
        ]
        for p in last_tap_paths:
            if os.path.exists(p):
                try:
                    with open(p, "w") as f:
                        json.dump({"uid": "", "timestamp": "", "is_new": False}, f)
                except Exception:
                    pass

        print("\n✅ DATA BERHASIL DIBERSIHKAN:")
        print(f"  - Absensi Log Dihapus       : {deleted_absensi}")
        print(f"  - Catatan Belajar Dihapus   : {deleted_catatan}")
        print(f"  - Bukti Transfer Dihapus    : {deleted_bukti}")
        print(f"  - Pembayaran SPP Dihapus    : {deleted_pembayaran}")
        print(f"  - Keuangan Dihapus          : {deleted_keuangan}")
        print(f"  - Jadwal Kelas Dihapus      : {deleted_jadwal}")
        print(f"  - Pendaftaran Baru Dihapus  : {deleted_pendaftaran}")
        print(f"  - Data Siswa Dihapus        : {deleted_siswa}")
        print(f"  - Data Guru Dihapus         : {deleted_guru}")
        print(f"  - Akun Guru/Ortu Dihapus    : {deleted_users}")

        admin_users = db.query(User).filter(User.role == UserRole.admin).all()
        owner_users = db.query(User).filter(User.role == UserRole.owner).all()
        print("\n🔒 STATUS & DAFTAR AKUN YANG DIPERTAHANKAN:")
        print(f"  - Total Akun Admin          : {len(admin_users)}")
        for u in admin_users:
            print(f"    • {u.email} ({u.nama})")
        print(f"  - Total Akun Direktur/Owner : {len(owner_users)}")
        for u in owner_users:
            print(f"    • {u.email} ({u.nama})")
        print("  - File Foto / Uploads       : AMAN & TIDAK DIHAPUS")
        print("==========================================================")

    except Exception as e:
        db.rollback()
        print("❌ Terjadi kesalahan saat membersihkan data:", str(e))
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    wipe_data()
