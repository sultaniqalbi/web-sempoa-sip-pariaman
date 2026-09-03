import logging
from datetime import datetime, date, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.redis import REDIS_HOST, REDIS_PORT, redis_client
from app.models.siswa import Siswa, StatusSPP
from app.models.users import User, UserRole
from app.models.pembayaran_periode import PembayaranPeriode, StatusPembayaran
from app.models.audit_log import AuditLog
from app.services.push_notification import send_push_to_user

logger = logging.getLogger("spp_scheduler")

# Background scheduler running in isolated daemon thread
scheduler = BackgroundScheduler(
    jobstores={"default": MemoryJobStore()},
    timezone="Asia/Jakarta"
)

def check_and_send_spp_reminders():
    """
    Tugas harian pukul 09:00 WIB:
    1. Cek siswa yang status SPP-nya BELUM_BAYAR / MENUNGGAK
    2. Cek siswa yang sisa pertemuannya <= 2
    3. Cek tagihan pembayaran_periode yang jatuh tempo H-3, H-1, atau Hari-H
    4. Kirim notifikasi Web Push ke akun Orang Tua
    """
    logger.info("Menjalankan cron scheduler: Pengecekan jatuh tempo SPP harian...")
    db: Session = SessionLocal()
    try:
        today = date.today()
        reminded_parents = set()
        total_pushed = 0

        # 1. Cari siswa aktif dengan status SPP expired / sisa pertemuan menipis
        siswa_candidates = db.query(Siswa).filter(
            Siswa.is_deleted == False,
            (Siswa.status_spp == StatusSPP.EXPIRED) | (Siswa.sisa_pertemuan <= 2)
        ).all()

        for s in siswa_candidates:
            # Cari akun ortu terhubung
            ortu_user = db.query(User).filter(
                User.role == UserRole.ortu,
                (User.uid_terhubung == str(s.id)) | (User.uid_terhubung == s.uid)
            ).first()

            if not ortu_user or ortu_user.id in reminded_parents:
                continue

            # Buat pesan pengingat yang ramah
            parent_greeting = s.nama_orang_tua if s.nama_orang_tua else "Ayah/Bunda"
            if s.sisa_pertemuan <= 2 and s.sisa_pertemuan > 0:
                body_text = f"Halo {parent_greeting}, sisa kelas ananda {s.nama} tinggal {s.sisa_pertemuan} sesi lagi. Mohon persiapkan pembayaran SPP periode berikutnya."
            elif s.sisa_pertemuan == 0:
                body_text = f"Halo {parent_greeting}, sesi belajar ananda {s.nama} telah habis. Silakan lakukan pembayaran SPP untuk melanjutkan jadwal kelas."
            else:
                body_text = f"Halo {parent_greeting}, tagihan SPP ananda {s.nama} telah mendekati jatuh tempo. Silakan cek rincian tagihan di portal."

            result = send_push_to_user(
                db=db,
                user_id=ortu_user.id,
                title="Pengingat SPP - Sempoa SIP Pariaman",
                body=body_text,
                url="/ortu/pembayaran"
            )

            if result.get("success", 0) > 0:
                total_pushed += 1
                reminded_parents.add(ortu_user.id)

        # 2. Pengecekan Khusus Siswa TK: 10 hari terakhir bulan (kuning) & 10 hari awal bulan (merah)
        current_month_str = today.strftime("%Y-%m")
        tk_students = db.query(Siswa).filter(
            Siswa.is_deleted == False,
            func.lower(Siswa.kategori_program).like('%tk%')
        ).all()

        for s_tk in tk_students:
            ortu_user = db.query(User).filter(
                User.role == UserRole.ortu,
                (User.uid_terhubung == str(s_tk.id)) | (User.uid_terhubung == s_tk.uid)
            ).first()

            if not ortu_user or ortu_user.id in reminded_parents:
                continue

            is_lunas = db.query(PembayaranPeriode).filter(
                PembayaranPeriode.id_siswa == s_tk.id,
                PembayaranPeriode.periode_bulan == current_month_str,
                PembayaranPeriode.status == StatusPembayaran.LUNAS
            ).first() is not None

            parent_greeting = s_tk.nama_orang_tua if s_tk.nama_orang_tua else "Ayah/Bunda"
            body_text = None

            if today.day >= 20:
                body_text = f"Halo {parent_greeting}, pengingat persiapan pembayaran SPP TK ananda {s_tk.nama} periode bulan depan (masuk Senin - Jumat)."
            elif today.day <= 10 and not is_lunas:
                body_text = f"Halo {parent_greeting}, tagihan SPP TK ananda {s_tk.nama} untuk bulan {today.strftime('%B %Y')} telah aktif (batas waktu tanggal 1-10)."

            if body_text:
                res_tk = send_push_to_user(
                    db=db,
                    user_id=ortu_user.id,
                    title="Pengingat SPP TK - Sempoa SIP Pariaman",
                    body=body_text,
                    url="/ortu/pembayaran"
                )
                if res_tk.get("success", 0) > 0:
                    total_pushed += 1
                    reminded_parents.add(ortu_user.id)

        # 3. Catat audit log batch
        audit = AuditLog(
            action="SCHEDULER_SPP_REMINDER",
            role="system",
            email="system@sempoasippariaman.com",
            details={
                "date": today.isoformat(),
                "students_checked": len(siswa_candidates),
                "notifications_sent": total_pushed
            },
            status="SUCCESS"
        )
        db.add(audit)
        db.commit()
        logger.info(f"Cron scheduler selesai: {total_pushed} ortu berhasil dikirimi pengingat SPP.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error saat menjalankan SPP reminder scheduler: {e}", exc_info=True)
    finally:
        db.close()

# Tracking alert terkirim hari ini agar tidak duplikat
_sent_upcoming_alerts = set()

def check_upcoming_class_reminders():
    """
    Pengecekan berkala setiap 5 menit:
    1. H-30 Menit ke Orang Tua:
       Notifikasi ke HP orang tua untuk bersiap mengantar anaknya ke tempat les.
    2. H-10 Menit ke Guru:
       Notifikasi ke HP guru pengajar untuk bersiap masuk ke ruang kelas.
    """
    now = datetime.now()
    today = now.date()
    today_str = today.isoformat()

    day_names = {
        0: "senin",
        1: "selasa",
        2: "rabu",
        3: "kamis",
        4: "jumat",
        5: "sabtu",
        6: "minggu"
    }
    today_day_name = day_names.get(now.weekday(), "")

    db: Session = SessionLocal()
    try:
        from app.models.jadwal import Jadwal
        from app.models.guru import Guru

        jadwals = db.query(Jadwal).all()
        for j in jadwals:
            # Periksa apakah jadwal aktif hari ini
            j_hari = (j.hari or "").lower()
            is_active_today = False
            if today_day_name in j_hari:
                is_active_today = True
            elif "senin - jumat" in j_hari and now.weekday() in [0, 1, 2, 3, 4]:
                is_active_today = True
            elif "senin - sabtu" in j_hari and now.weekday() in [0, 1, 2, 3, 4, 5]:
                is_active_today = True

            if not is_active_today:
                continue

            try:
                parts = j.jam_mulai.strip().split(":")
                start_hour = int(parts[0])
                start_minute = int(parts[1])
                class_start_time = datetime(now.year, now.month, now.day, start_hour, start_minute)
            except Exception:
                continue

            diff_minutes = (class_start_time - now).total_seconds() / 60.0

            # 1. REMINDER H-30 MENIT KE ORANG TUA (20 <= diff_minutes <= 35)
            if 20 <= diff_minutes <= 35:
                siswa_ids = []
                if j.siswa_ids:
                    for sid_str in j.siswa_ids.split(","):
                        if sid_str.strip().isdigit():
                            siswa_ids.append(int(sid_str.strip()))
                elif j.id_siswa:
                    siswa_ids.append(j.id_siswa)

                if not siswa_ids:
                    target_siswas = db.query(Siswa).filter(
                        Siswa.is_deleted == False,
                        func.lower(Siswa.kategori_program).like(f"%{j.kategori_program.lower()}%")
                    ).all()
                else:
                    target_siswas = db.query(Siswa).filter(Siswa.id.in_(siswa_ids), Siswa.is_deleted == False).all()

                for s in target_siswas:
                    alert_key = f"ortu_h30:{j.id}:{today_str}:{s.id}"
                    if alert_key in _sent_upcoming_alerts:
                        continue

                    ortu_user = db.query(User).filter(
                        User.role == UserRole.ortu,
                        (User.uid_terhubung == str(s.id)) | (User.uid_terhubung == s.uid)
                    ).first()

                    if ortu_user:
                        lokasi_str = j.lokasi or "TC Pariaman"
                        send_push_to_user(
                            db=db,
                            user_id=ortu_user.id,
                            title=f"Jadwal Kelas {j.kategori_program}",
                            body=f"Halo Ibu/Pak, 30 menit lagi kelas {j.kategori_program} untuk ananda {s.nama} akan dimulai pukul {j.jam_mulai} WIB di {lokasi_str}. Mohon bersiap mengantar ananda.",
                            url="/ortu/jadwal"
                        )
                        _sent_upcoming_alerts.add(alert_key)

            # 2. REMINDER H-10 MENIT KE GURU (5 <= diff_minutes <= 15)
            if 5 <= diff_minutes <= 15:
                guru_ids = []
                if j.guru_ids:
                    for gid_str in j.guru_ids.split(","):
                        if gid_str.strip().isdigit():
                            guru_ids.append(int(gid_str.strip()))
                elif j.id_guru:
                    guru_ids.append(j.id_guru)

                if not guru_ids:
                    gurus = db.query(Guru).filter(
                        Guru.is_deleted == False,
                        func.lower(Guru.kategori_program).like(f"%{j.kategori_program.lower()}%")
                    ).all()
                else:
                    gurus = db.query(Guru).filter(Guru.id.in_(guru_ids), Guru.is_deleted == False).all()

                for g in gurus:
                    alert_key = f"guru_h10:{j.id}:{today_str}:{g.id}"
                    if alert_key in _sent_upcoming_alerts:
                        continue

                    guru_user = db.query(User).filter(
                        User.role == UserRole.guru,
                        (User.uid_terhubung == str(g.id)) | (User.uid_terhubung == g.uid) | (func.lower(User.nama) == func.lower(g.nama))
                    ).first()

                    if guru_user:
                        lokasi_str = j.lokasi or "ruang kelas"
                        send_push_to_user(
                            db=db,
                            user_id=guru_user.id,
                            title=f"Panggilan Mengajar - {j.kategori_program}",
                            body=f"10 menit lagi kelas {j.kategori_program} di {lokasi_str} akan dimulai pukul {j.jam_mulai} WIB. Mohon segera bersiap dan masuk ke ruangan.",
                            url="/guru/dashboard"
                        )
                        _sent_upcoming_alerts.add(alert_key)

    except Exception as e:
        logger.error(f"Error checking upcoming class reminders: {e}", exc_info=True)
    finally:
        db.close()

# Daftarkan job harian setiap pukul 09:00 WIB untuk cek SPP
scheduler.add_job(
    check_and_send_spp_reminders,
    trigger="cron",
    hour=9,
    minute=0,
    id="daily_spp_reminder",
    replace_existing=True
)

# Daftarkan job interval setiap 5 menit untuk reminder kelas H-30 (ortu) dan H-10 (guru)
scheduler.add_job(
    check_upcoming_class_reminders,
    trigger="interval",
    minutes=5,
    id="upcoming_class_reminder",
    replace_existing=True
)

def start_scheduler():
    if not scheduler.running:
        try:
            scheduler.start()
            logger.info("APScheduler async runner started successfully with SPP & Class reminders.")
        except Exception as e:
            logger.error(f"Failed to start APScheduler: {e}")

def shutdown_scheduler():
    if scheduler.running:
        try:
            scheduler.shutdown(wait=False)
            logger.info("APScheduler stopped.")
        except Exception as e:
            logger.error(f"Failed to stop APScheduler: {e}")
