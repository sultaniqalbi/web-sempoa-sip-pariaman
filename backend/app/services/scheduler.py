import logging
from datetime import datetime, date, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from sqlalchemy.orm import Session

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

        # 2. Catat audit log batch
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

# Daftarkan job harian setiap pukul 09:00 WIB
scheduler.add_job(
    check_and_send_spp_reminders,
    trigger="cron",
    hour=9,
    minute=0,
    id="daily_spp_reminder",
    replace_existing=True
)

def start_scheduler():
    if not scheduler.running:
        try:
            scheduler.start()
            logger.info("APScheduler async runner started successfully.")
        except Exception as e:
            logger.error(f"Failed to start APScheduler: {e}")

def shutdown_scheduler():
    if scheduler.running:
        try:
            scheduler.shutdown(wait=False)
            logger.info("APScheduler stopped.")
        except Exception as e:
            logger.error(f"Failed to stop APScheduler: {e}")
