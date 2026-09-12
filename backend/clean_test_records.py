import sys
from sqlalchemy import or_
from app.core.database import SessionLocal
from app.models.catatan_pembelajaran import CatatanPembelajaran
from app.models.evaluasi_siswa import EvaluasiSiswa
from app.models.absensi_log import AbsensiLog
from app.models.buku_siswa import BukuSiswa
from app.models.pendaftaran_baru import PendaftaranBaru
from app.models.keuangan import Keuangan

def clean_test_data():
    db = SessionLocal()
    try:
        print("=" * 70)
        print(" PEMBERSIHAN DATA TEST / DUMMY / COBA-COBA")
        print("=" * 70 + "\n")

        # 1. Bersihkan Catatan Pembelajaran berisi "tes", "test", "coba", "dummy"
        test_notes = db.query(CatatanPembelajaran).filter(
            or_(
                CatatanPembelajaran.catatan.ilike("%tes%"),
                CatatanPembelajaran.catatan.ilike("%test%"),
                CatatanPembelajaran.catatan.ilike("%coba%"),
                CatatanPembelajaran.catatan.ilike("%dummy%")
            )
        ).all()

        if test_notes:
            print(f"🧹 Menghapus {len(test_notes)} Catatan Pembelajaran Uji Coba:")
            for n in test_notes:
                print(f"   [DELETED] ID {n.id} | Tgl: {n.tanggal} | Program: {n.kategori_program} | Catatan: \"{n.catatan}\"")
                db.delete(n)
        else:
            print("✅ Tidak ada Catatan Pembelajaran uji coba yang perlu dihapus.")

        # 2. Bersihkan Evaluasi Siswa berisi "tes", "test", "coba", "dummy"
        test_evals = db.query(EvaluasiSiswa).filter(
            or_(
                EvaluasiSiswa.catatan_guru.ilike("%tes%"),
                EvaluasiSiswa.catatan_guru.ilike("%test%"),
                EvaluasiSiswa.catatan_guru.ilike("%coba%"),
                EvaluasiSiswa.catatan_guru.ilike("%dummy%"),
                EvaluasiSiswa.saran_untuk_ortu.ilike("%tes%"),
                EvaluasiSiswa.saran_untuk_ortu.ilike("%test%")
            )
        ).all()

        if test_evals:
            print(f"\n🧹 Menghapus {len(test_evals)} Evaluasi Siswa Uji Coba:")
            for e in test_evals:
                print(f"   [DELETED] ID {e.id} | Siswa #{e.id_siswa} | Catatan: \"{e.catatan_guru}\"")
                db.delete(e)
        else:
            print("✅ Tidak ada Evaluasi Siswa uji coba yang perlu dihapus.")

        # 3. Periksa Absensi Log dengan catatan "tes" / "test" / "dummy"
        # Jika UID-nya adalah dummy (contoh SW-DUMMY, GR-DUMMY), hapus baris log tersebut.
        # Jika UID-nya siswa asli tapi catatannya berisi "tes", bersihkan teks catatannya saja.
        test_logs = db.query(AbsensiLog).filter(
            or_(
                AbsensiLog.catatan.ilike("%tes%"),
                AbsensiLog.catatan.ilike("%test%"),
                AbsensiLog.catatan.ilike("%coba%"),
                AbsensiLog.catatan.ilike("%dummy%"),
                AbsensiLog.uid.ilike("%dummy%")
            )
        ).all()

        if test_logs:
            print(f"\n🧹 Memproses {len(test_logs)} Log Absensi yang terindikasi uji coba:")
            for l in test_logs:
                if "dummy" in (l.uid or "").lower():
                    print(f"   [DELETED LOG DUMMY] ID {l.id} | UID: {l.uid} | Waktu: {l.waktu}")
                    db.delete(l)
                else:
                    print(f"   [CLEANED NOTE] ID {l.id} | UID Siswa Asli: {l.uid} | Catatan lama: \"{l.catatan}\" -> Dikosongkan")
                    l.catatan = None
        else:
            print("✅ Tidak ada log absensi uji coba yang perlu dibersihkan.")

        # 4. Periksa Pendaftaran Baru uji coba
        test_pendaftaran = db.query(PendaftaranBaru).filter(
            or_(
                PendaftaranBaru.nama_anak.ilike("%tes%"),
                PendaftaranBaru.nama_anak.ilike("%test%"),
                PendaftaranBaru.nama_anak.ilike("%dummy%"),
                PendaftaranBaru.catatan.ilike("%tes%"),
                PendaftaranBaru.catatan.ilike("%test%"),
                PendaftaranBaru.catatan.ilike("%coba%")
            )
        ).all()

        if test_pendaftaran:
            print(f"\n🧹 Menghapus {len(test_pendaftaran)} Pendaftaran Baru Uji Coba:")
            for p in test_pendaftaran:
                print(f"   [DELETED] ID {p.id} | Anak: {p.nama_anak} | Ortu: {p.nama_ortu} | Catatan: \"{p.catatan}\"")
                db.delete(p)
        else:
            print("✅ Tidak ada pendaftaran baru uji coba yang perlu dihapus.")

        # Commit semua perubahan
        db.commit()
        print("\n" + "=" * 70)
        print(" SUKSES: Semua data uji coba/dummy berhasil dibersihkan permanen!")
        print(" Database kini bersih dan siap digunakan secara resmi.")
        print("=" * 70)

    except Exception as e:
        db.rollback()
        print(f"Error saat pembersihan: {e}", file=sys.stderr)
    finally:
        db.close()

if __name__ == "__main__":
    clean_test_data()
