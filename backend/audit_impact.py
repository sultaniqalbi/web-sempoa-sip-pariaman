from sqlalchemy import func
from app.models.guru import Guru
from app.models.siswa import Siswa
from app.models.absensi_log import AbsensiLog
from app.core.database import SessionLocal
from datetime import timezone, timedelta

WIB = timezone(timedelta(hours=7))

def to_wib(dt):
    if not dt:
        return None
    if dt.tzinfo:
        return dt.astimezone(WIB)
    return dt.replace(tzinfo=WIB)

try:
    db = SessionLocal()

    # 1. AUDIT GURU & LOG ABSENSI HARI SABTU
    print("=================================================================")
    print("   1. AUDIT LOG ABSENSI GURU HARI SABTU (POTENSI TERDAMPAK JAM 10:00)")
    print("=================================================================")
    
    gurus = db.query(Guru).all()
    guru_map = {}
    for g in gurus:
        if g.uid:
            guru_map[g.uid.strip().upper()] = g
            guru_map[g.uid.strip().upper().replace(" ", "")] = g

    all_logs = db.query(AbsensiLog).order_by(AbsensiLog.waktu.asc()).all()
    saturday_logs = []
    for l in all_logs:
        w_wib = to_wib(l.waktu)
        if w_wib and w_wib.weekday() == 5: # 5 = Sabtu
            clean_u = l.uid.strip().upper() if l.uid else ""
            nospace_u = clean_u.replace(" ", "")
            matched_g = guru_map.get(clean_u) or guru_map.get(nospace_u)
            saturday_logs.append((l, w_wib, matched_g))

    if saturday_logs:
        print(f"Ditemukan {len(saturday_logs)} log absensi pada hari Sabtu:\n")
        for log_obj, w_wib, g in saturday_logs:
            nama = g.nama if g else "Kartu Belum Terdaftar"
            role = g.kategori_program if g else "N/A"
            w_str = w_wib.strftime("%Y-%m-%d %H:%M:%S WIB")
            hour = w_wib.hour
            minute = w_wib.minute
            sec = w_wib.second
            
            # Cek jika datang antara 08:00:01 s/d 10:00:00 (sebelumnya telat di aturan jam 8, sekarang tepat waktu di aturan jam 10)
            was_late_old = (hour > 8) or (hour == 8 and (minute > 0 or sec > 0))
            is_late_new = (hour > 10) or (hour == 10 and (minute > 0 or sec > 0))
            
            catatan = ""
            if was_late_old and not is_late_new:
                catatan = ">>> BERUBAH: DARI TERLAMBAT -> JADI HADIR TEPAT WAKTU (karena batas Sabtu jam 10:00)"
            elif is_late_new:
                catatan = ">>> TETAP TERLAMBAT (karena lewat jam 10:00)"
            else:
                catatan = ">>> TETAP HADIR (datang sebelum jam 08:00)"

            print(f"- Log ID: {log_obj.id} | Nama: {nama} | Role: {role}")
            print(f"  Waktu Tap: {w_str} | Status di DB: {log_obj.status}")
            print(f"  Dampak: {catatan}\n")
    else:
        print("Tidak ada log absensi hari Sabtu yang tercatat sejauh ini di database.\n")

    # 2. AUDIT SISWA DENGAN SISA PERTEMUAN 0 / EXPIRED
    print("=================================================================")
    print("   2. AUDIT DATA SISWA DENGAN SISA PERTEMUAN 0 / STATUS EXPIRED")
    print("=================================================================")
    all_siswa = db.query(Siswa).filter(Siswa.is_deleted == False).order_by(Siswa.id.asc()).all()
    print(f"Total seluruh siswa aktif di database: {len(all_siswa)}\n")

    zero_quota_students = []
    active_students = []
    for s in all_siswa:
        if s.sisa_pertemuan == 0 or str(s.status_spp).upper() == "EXPIRED":
            zero_quota_students.append(s)
        else:
            active_students.append(s)

    print(f"A. Siswa dengan Sisa Pertemuan 0 / Status EXPIRED (Total: {len(zero_quota_students)} siswa):")
    if zero_quota_students:
        for s in zero_quota_students:
            print(f"- ID: {s.id} | Nama: {s.nama} | Program: {s.kategori_program}")
            print(f"  Sisa Pertemuan: {s.sisa_pertemuan} / Target: {s.target_pertemuan} | Status SPP: {s.status_spp} | Kuota JSON: {s.kuota_program}")
    else:
        print("  (Nihil - tidak ada siswa berstatus sisa 0 / expired)")

    print(f"\nB. Siswa dengan Sisa Pertemuan Aktif > 0 (Total: {len(active_students)} siswa):")
    for s in active_students:
        print(f"- ID: {s.id} | Nama: {s.nama} | Program: {s.kategori_program} | Sisa: {s.sisa_pertemuan}/{s.target_pertemuan} | Status: {s.status_spp}")

except Exception as e:
    print(f"Error saat audit: {e}")
