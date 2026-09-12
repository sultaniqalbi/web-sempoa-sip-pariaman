import os
import sys
from sqlalchemy import or_, func, text
from app.core.database import SessionLocal
from app.models.users import User
from app.models.siswa import Siswa
from app.models.guru import Guru
from app.models.catatan_pembelajaran import CatatanPembelajaran
from app.models.evaluasi_siswa import EvaluasiSiswa
from app.models.absensi_log import AbsensiLog
from app.models.jadwal import Jadwal
from app.models.buku_siswa import BukuSiswa
from app.models.pembayaran_periode import PembayaranPeriode
from app.models.pendaftaran_baru import PendaftaranBaru
from app.models.keuangan import Keuangan

TEST_KEYWORDS = [
    'tes', 'test', 'testing', 'tester', 'coba', 'dummy', 'demo',
    'sample', 'deploy', 'percobaan', 'fake', 'trial', 'contoh'
]

def contains_test_kw(text_val: str) -> bool:
    if not text_val:
        return False
    val_lower = str(text_val).lower()
    for kw in TEST_KEYWORDS:
        # Check if keyword is in the value (with word boundary or explicit presence)
        if kw in val_lower:
            return True
    return False

def run_audit():
    db = SessionLocal()
    try:
        print("=" * 80)
        print(" AUDIT DATABASE: PEMERIKSAAN DATA DUMMY / TEST / DEPLOY")
        print(" Kata Kunci Dicari:", ", ".join(TEST_KEYWORDS))
        print("=" * 80 + "\n")

        # 1. USERS / AKUN
        print("--- [1] AUDIT TABEL USERS (AKUN PENGGUNA) ---")
        all_users = db.query(User).all()
        print(f"Total Akun Terdaftar: {len(all_users)}")
        
        suspicious_users = []
        for u in all_users:
            reasons = []
            if contains_test_kw(u.email):
                reasons.append(f"email '{u.email}'")
            if contains_test_kw(u.nama):
                reasons.append(f"nama '{u.nama}'")
            if contains_test_kw(u.uid_terhubung):
                reasons.append(f"uid_terhubung '{u.uid_terhubung}'")
            if reasons:
                suspicious_users.append((u, ", ".join(reasons)))

        if suspicious_users:
            print(f"⚠️ Ditemukan {len(suspicious_users)} akun berbau TEST / DUMMY:")
            for u, r in suspicious_users:
                print(f"  - ID: {u.id} | Email: {u.email} | Nama: {u.nama} | Role: {u.role.value if hasattr(u.role, 'value') else u.role} | Alasan: {r}")
        else:
            print("✅ Tidak ditemukan akun berbau test/dummy.")
            
        print("\n  Daftar Seluruh Akun yang Ada di Database Saat Ini:")
        for u in all_users:
            role_str = u.role.value if hasattr(u.role, 'value') else str(u.role)
            print(f"    • ID {u.id:2d} | {role_str:6s} | {u.email:30s} | {u.nama or '-':25s} | UID Terhubung: {u.uid_terhubung or '-'}")
        print()

        # 2. CATATAN PEMBELAJARAN
        print("--- [2] AUDIT TABEL CATATAN PEMBELAJARAN ---")
        all_notes = db.query(CatatanPembelajaran).all()
        print(f"Total Catatan Pembelajaran: {len(all_notes)}")
        suspicious_notes = []
        for n in all_notes:
            if contains_test_kw(n.catatan) or contains_test_kw(n.kategori_program):
                suspicious_notes.append(n)
        
        if suspicious_notes:
            print(f"⚠️ Ditemukan {len(suspicious_notes)} Catatan Pembelajaran terindikasi TEST/DUMMY:")
            for n in suspicious_notes:
                print(f"  - ID: {n.id} | Tgl: {n.tanggal} | Guru ID: {n.id_guru} | Siswa ID: {n.id_siswa} | Program: {n.kategori_program}")
                print(f"    Isi Catatan: \"{n.catatan}\"\n")
        else:
            print("✅ Tidak ditemukan catatan pembelajaran berbau test/dummy.")

        # Tampilkan 5 catatan terakhir untuk konteks
        if all_notes:
            print(f"  Contoh riwayat catatan pembelajaran yang ada ({min(5, len(all_notes))} terakhir):")
            for n in sorted(all_notes, key=lambda x: x.id, reverse=True)[:5]:
                print(f"    • ID {n.id} ({n.tanggal}) [{n.kategori_program}]: \"{(n.catatan or '')[:80]}\"")
        print()

        # 3. EVALUASI SISWA
        print("--- [3] AUDIT TABEL EVALUASI SISWA ---")
        all_evals = db.query(EvaluasiSiswa).all()
        print(f"Total Evaluasi Siswa: {len(all_evals)}")
        suspicious_evals = []
        for e in all_evals:
            if (contains_test_kw(e.catatan_guru) or 
                contains_test_kw(e.saran_untuk_ortu) or 
                contains_test_kw(e.predikat_keseluruhan) or 
                contains_test_kw(e.periode_evaluasi)):
                suspicious_evals.append(e)

        if suspicious_evals:
            print(f"⚠️ Ditemukan {len(suspicious_evals)} Evaluasi Siswa terindikasi TEST/DUMMY:")
            for e in suspicious_evals:
                print(f"  - ID: {e.id} | Siswa ID: {e.id_siswa} | Guru ID: {e.id_guru} | Tgl: {e.tanggal_evaluasi} | Predikat: {e.predikat_keseluruhan}")
                print(f"    Catatan Guru: \"{e.catatan_guru}\"")
                if e.saran_untuk_ortu:
                    print(f"    Saran Ortu:   \"{e.saran_untuk_ortu}\"")
                print()
        else:
            print("✅ Tidak ditemukan evaluasi siswa berbau test/dummy.")

        if all_evals:
            print(f"  Contoh evaluasi yang ada ({min(5, len(all_evals))} terakhir):")
            for e in sorted(all_evals, key=lambda x: x.id, reverse=True)[:5]:
                print(f"    • ID {e.id} (Siswa #{e.id_siswa}, {e.tanggal_evaluasi}): \"{(e.catatan_guru or '')[:80]}\"")
        print()

        # 4. SISWA
        print("--- [4] AUDIT TABEL SISWA ---")
        all_siswa = db.query(Siswa).all()
        print(f"Total Siswa: {len(all_siswa)}")
        suspicious_siswa = []
        for s in all_siswa:
            if (contains_test_kw(s.nama) or 
                contains_test_kw(s.nama_panggilan) or 
                contains_test_kw(s.uid) or 
                contains_test_kw(s.nama_orang_tua) or 
                contains_test_kw(s.catatan)):
                suspicious_siswa.append(s)

        if suspicious_siswa:
            print(f"⚠️ Ditemukan {len(suspicious_siswa)} Siswa terindikasi TEST/DUMMY:")
            for s in suspicious_siswa:
                print(f"  - ID: {s.id} | UID: {s.uid} | Nama: {s.nama} ({s.nama_panggilan}) | Program: {s.kategori_program} | Ortu: {s.nama_orang_tua} | Deleted: {s.is_deleted}")
        else:
            print("✅ Tidak ditemukan data siswa berbau test/dummy.")
        print()

        # 5. GURU
        print("--- [5] AUDIT TABEL GURU ---")
        all_guru = db.query(Guru).all()
        print(f"Total Guru: {len(all_guru)}")
        suspicious_guru = []
        for g in all_guru:
            if (contains_test_kw(g.nama) or 
                contains_test_kw(g.nama_panggilan) or 
                contains_test_kw(g.uid)):
                suspicious_guru.append(g)

        if suspicious_guru:
            print(f"⚠️ Ditemukan {len(suspicious_guru)} Guru terindikasi TEST/DUMMY:")
            for g in suspicious_guru:
                print(f"  - ID: {g.id} | UID: {g.uid} | Nama: {g.nama} ({g.nama_panggilan}) | Program: {g.kategori_program} | Deleted: {g.is_deleted}")
        else:
            print("✅ Tidak ditemukan data guru berbau test/dummy.")
        print()

        # 6. ABSENSI LOG
        print("--- [6] AUDIT TABEL ABSENSI LOG ---")
        all_logs_count = db.query(AbsensiLog).count()
        print(f"Total Baris Absensi: {all_logs_count}")
        suspicious_logs = db.query(AbsensiLog).filter(
            or_(
                AbsensiLog.catatan.ilike("%tes%"),
                AbsensiLog.catatan.ilike("%test%"),
                AbsensiLog.catatan.ilike("%coba%"),
                AbsensiLog.catatan.ilike("%dummy%"),
                AbsensiLog.uid.ilike("%dummy%"),
                AbsensiLog.uid.ilike("%test%")
            )
        ).all()
        if suspicious_logs:
            print(f"⚠️ Ditemukan {len(suspicious_logs)} Log Absensi terindikasi TEST/DUMMY:")
            for l in suspicious_logs[:20]:
                print(f"  - ID: {l.id} | UID: {l.uid} | Waktu: {l.waktu} | Status: {l.status} | Catatan: \"{l.catatan}\"")
            if len(suspicious_logs) > 20:
                print(f"  ... dan {len(suspicious_logs) - 20} log lainnya.")
        else:
            print("✅ Tidak ditemukan log absensi berbau test/dummy.")
        print()

        # 7. BUKU SISWA
        print("--- [7] AUDIT TABEL BUKU SISWA ---")
        all_buku = db.query(BukuSiswa).all()
        print(f"Total Riwayat Buku Siswa: {len(all_buku)}")
        suspicious_buku = []
        for b in all_buku:
            if (contains_test_kw(b.catatan_progres) or 
                contains_test_kw(b.nomor_buku) or 
                contains_test_kw(b.jenis_buku)):
                suspicious_buku.append(b)
        if suspicious_buku:
            print(f"⚠️ Ditemukan {len(suspicious_buku)} Buku Siswa terindikasi TEST/DUMMY:")
            for b in suspicious_buku:
                print(f"  - ID: {b.id} | Siswa ID: {b.id_siswa} | Level: {b.level_anak} | No: {b.nomor_buku} | Catatan: \"{b.catatan_progres}\"")
        else:
            print("✅ Tidak ditemukan riwayat buku berbau test/dummy.")
        print()

        # 8. JADWAL
        print("--- [8] AUDIT TABEL JADWAL ---")
        all_jadwal = db.query(Jadwal).all()
        print(f"Total Jadwal: {len(all_jadwal)}")
        suspicious_jadwal = [j for j in all_jadwal if contains_test_kw(j.lokasi) or contains_test_kw(j.kategori_program)]
        if suspicious_jadwal:
            print(f"⚠️ Ditemukan {len(suspicious_jadwal)} Jadwal terindikasi TEST/DUMMY:")
            for j in suspicious_jadwal:
                print(f"  - ID: {j.id} | Hari: {j.hari} | Program: {j.kategori_program} | Lokasi: {j.lokasi}")
        else:
            print("✅ Tidak ditemukan jadwal berbau test/dummy.")
        print()

        # 9. PENDAFTARAN BARU
        print("--- [9] AUDIT TABEL PENDAFTARAN BARU ---")
        all_reg = db.query(PendaftaranBaru).all()
        print(f"Total Pendaftaran: {len(all_reg)}")
        suspicious_reg = [r for r in all_reg if contains_test_kw(r.nama) or contains_test_kw(r.catatan) or contains_test_kw(r.nama_orang_tua)]
        if suspicious_reg:
            print(f"⚠️ Ditemukan {len(suspicious_reg)} Pendaftaran terindikasi TEST/DUMMY:")
            for r in suspicious_reg:
                print(f"  - ID: {r.id} | Nama: {r.nama} | Ortu: {r.nama_orang_tua} | Catatan: \"{r.catatan}\"")
        else:
            print("✅ Tidak ditemukan pendaftaran berbau test/dummy.")
        print()

        # 10. PEMBAYARAN & KEUANGAN
        print("--- [10] AUDIT TABEL PEMBAYARAN PERIODE & KEUANGAN ---")
        all_pem = db.query(PembayaranPeriode).all()
        print(f"Total Pembayaran Periode: {len(all_pem)}")
        suspicious_pem = [p for p in all_pem if contains_test_kw(p.keterangan)]
        if suspicious_pem:
            print(f"⚠️ Ditemukan {len(suspicious_pem)} Pembayaran terindikasi TEST/DUMMY:")
            for p in suspicious_pem:
                print(f"  - ID: {p.id} | Siswa ID: {p.id_siswa} | Keterangan: \"{p.keterangan}\"")
        else:
            print("✅ Tidak ditemukan pembayaran berbau test/dummy.")

        all_keu = db.query(Keuangan).all()
        print(f"Total Transaksi Keuangan: {len(all_keu)}")
        suspicious_keu = [k for k in all_keu if contains_test_kw(k.keterangan) or contains_test_kw(k.kategori)]
        if suspicious_keu:
            print(f"⚠️ Ditemukan {len(suspicious_keu)} Keuangan terindikasi TEST/DUMMY:")
            for k in suspicious_keu:
                print(f"  - ID: {k.id} | Tgl: {k.tanggal} | Ket: \"{k.keterangan}\"")
        else:
            print("✅ Tidak ditemukan catatan keuangan berbau test/dummy.")

        print("\n" + "=" * 80)
        print(" AUDIT SELESAI - SEMUA TABEL TELAH DIPERIKSA")
        print("=" * 80)

    except Exception as e:
        print(f"Error saat audit: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_audit()
