from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.core.database import get_db, SessionLocal, engine, Base
from sqlalchemy import text, func

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"422 Validation Error on {request.url}")
    if settings.fastapi_env == "production":
        return JSONResponse(
            status_code=422,
            content={"detail": "Format data yang dikirim tidak valid."},
        )
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

import os
from pathlib import Path
from app.core.database import engine, Base
import app.models  # Crucial: load all models into Base.metadata before create_all
from app.seed_data import run_seed

app = FastAPI(
    title="Sempoa SIP API",
    version="1.0.0",
    description="API for Sempoa SIP TC Pariaman attendance system",
    docs_url="/docs" if settings.fastapi_env != "production" else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.fastapi_env != "production" else None
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)

@app.on_event("startup")
def on_startup():
    # Ensure backup directory exists
    backup_dir = Path(os.getenv("BACKUP_DIR", "backups"))
    backup_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Backup directory initialized at: {backup_dir.resolve()}")
    
    # Auto-create tables & seed admin/owner accounts
    try:
        Base.metadata.create_all(bind=engine)
        
        # Auto-migration for mode_kelas (add if not exists)
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE jadwal ADD COLUMN mode_kelas VARCHAR(20) DEFAULT 'OFFLINE' NOT NULL;"))
                conn.commit()
                logger.info("Auto-migration: Added mode_kelas to jadwal")
        except Exception as mig_e:
            if "duplicate column name" not in str(mig_e).lower() and "already exists" not in str(mig_e).lower():
                logger.warning(f"Auto-migration skipped or failed: {mig_e}")

        # Auto-migration for multi-program expanded columns and schema updates
        auto_sqls = [
            "ALTER TABLE siswa ALTER COLUMN kategori_program TYPE VARCHAR(255);",
            "ALTER TABLE siswa ALTER COLUMN paket_jadwal TYPE VARCHAR(255);",
            "ALTER TABLE siswa ALTER COLUMN hari_masuk TYPE VARCHAR(255);",
            "ALTER TABLE siswa ADD COLUMN IF NOT EXISTS id_guru INTEGER;",
            "ALTER TABLE siswa ADD COLUMN IF NOT EXISTS kuota_program TEXT;",
            "ALTER TABLE siswa ADD COLUMN IF NOT EXISTS guru_per_program TEXT;",
            "ALTER TABLE siswa ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS uid_terhubung VARCHAR(50);",
            "ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS guru_ids VARCHAR(255);",
            "ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS siswa_ids VARCHAR(500);",
            "ALTER TABLE jadwal ADD COLUMN IF NOT EXISTS mode_kelas VARCHAR(20) DEFAULT 'OFFLINE';",
            "ALTER TABLE guru ALTER COLUMN kategori_program TYPE VARCHAR(255);",
            "ALTER TABLE guru ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE guru ADD COLUMN IF NOT EXISTS jam_masuk VARCHAR(5);",
            "ALTER TABLE guru ADD COLUMN IF NOT EXISTS jam_keluar VARCHAR(5);",
            "UPDATE guru SET jam_masuk = '07:00' WHERE jam_masuk IS NULL;",
            "UPDATE guru SET jam_keluar = '17:00' WHERE jam_keluar IS NULL;",
            "ALTER TABLE absensi_log ADD COLUMN IF NOT EXISTS kategori_program VARCHAR(100);",
            "ALTER TABLE absensi_log ADD COLUMN IF NOT EXISTS sumber VARCHAR(50);",
            "ALTER TABLE absensi_log ADD COLUMN IF NOT EXISTS catatan TEXT;",
            "ALTER TABLE absensi_log ADD COLUMN IF NOT EXISTS jumlah_sesi INTEGER DEFAULT 1;",
            "CREATE INDEX IF NOT EXISTS idx_absensi_uid_waktu ON absensi_log (uid, waktu);",
            """DO $$ BEGIN
                CREATE TYPE status_buku_enum AS ENUM ('SEDANG_DIPELAJARI', 'SELESAI', 'LANJUT_LEVEL');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;""",
            """CREATE TABLE IF NOT EXISTS buku_siswa (
                id SERIAL PRIMARY KEY,
                id_siswa INTEGER NOT NULL,
                kategori_program VARCHAR(100) NOT NULL,
                level_anak VARCHAR(100) NOT NULL,
                nomor_buku VARCHAR(100) NOT NULL,
                jenis_buku VARCHAR(150),
                status_buku VARCHAR(50) NOT NULL DEFAULT 'SEDANG_DIPELAJARI',
                tanggal_mulai DATE NOT NULL DEFAULT CURRENT_DATE,
                tanggal_selesai DATE,
                catatan_progres TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS evaluasi_siswa (
                id SERIAL PRIMARY KEY,
                id_siswa INTEGER NOT NULL,
                id_guru INTEGER,
                kategori_program VARCHAR(100) NOT NULL,
                tanggal_evaluasi DATE NOT NULL DEFAULT CURRENT_DATE,
                periode_evaluasi VARCHAR(100),
                nilai_fokus VARCHAR(50) NOT NULL DEFAULT 'Baik',
                nilai_kecepatan VARCHAR(50) NOT NULL DEFAULT 'Baik',
                nilai_ketelitian VARCHAR(50) NOT NULL DEFAULT 'Baik',
                nilai_pemahaman VARCHAR(50) NOT NULL DEFAULT 'Baik',
                predikat_keseluruhan VARCHAR(50) NOT NULL DEFAULT 'Baik',
                catatan_guru TEXT NOT NULL,
                saran_untuk_ortu TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );""",
            """CREATE TABLE IF NOT EXISTS audit_log (
                id SERIAL PRIMARY KEY,
                action VARCHAR(50) NOT NULL,
                role VARCHAR(20) NOT NULL,
                email VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                details JSON,
                status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
                backup_file VARCHAR(255)
            );""",
            """INSERT INTO buku_siswa (id_siswa, kategori_program, level_anak, nomor_buku, status_buku, tanggal_mulai)
            SELECT s.id, SPLIT_PART(s.kategori_program, ',', 1), 'Junior', '', 'SEDANG_DIPELAJARI', CURRENT_DATE
            FROM siswa s
            WHERE s.is_deleted = FALSE 
              AND NOT EXISTS (
                SELECT 1 FROM buku_siswa b WHERE b.id_siswa = s.id
              );""",
            """CREATE TABLE IF NOT EXISTS program_settings (
                id SERIAL PRIMARY KEY,
                nama_program VARCHAR(100) UNIQUE NOT NULL,
                biaya_spp NUMERIC(12, 2) NOT NULL DEFAULT 200000.00,
                target_pertemuan INTEGER NOT NULL DEFAULT 12,
                jam_mulai VARCHAR(20) DEFAULT '08:00',
                jam_selesai VARCHAR(20) DEFAULT '12:00',
                hari_masuk VARCHAR(255) DEFAULT 'Senin - Jumat',
                keterangan TEXT,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );""",
            "UPDATE jadwal SET jam_mulai = '07:30', jam_selesai = '13:30' WHERE LOWER(kategori_program) LIKE '%tk%';",
            "UPDATE guru SET paket_pengajaran = 'Fleksibel' WHERE is_deleted = FALSE AND (LOWER(kategori_program) LIKE '%kepala sekolah%' OR LOWER(kategori_program) LIKE '%direktur%' OR LOWER(kategori_program) LIKE '%admin%');",
            "UPDATE guru SET paket_pengajaran = '07:30 - 13:30 WIB' WHERE is_deleted = FALSE AND LOWER(kategori_program) LIKE '%tk%' AND (paket_pengajaran IS NULL OR paket_pengajaran = 'Reguler' OR paket_pengajaran = '09:00');",
            "UPDATE guru SET paket_pengajaran = '09:00 - 17:00 WIB' WHERE is_deleted = FALSE AND (LOWER(kategori_program) LIKE '%sempoa%' OR LOWER(kategori_program) LIKE '%fonem%') AND (paket_pengajaran IS NULL OR paket_pengajaran = 'Reguler' OR paket_pengajaran = '09:00');",
            "UPDATE guru SET paket_pengajaran = '12:00 - 17:00 WIB' WHERE is_deleted = FALSE AND (LOWER(kategori_program) LIKE '%inggris%' OR LOWER(kategori_program) LIKE '%tahfidz%') AND (paket_pengajaran IS NULL OR paket_pengajaran = 'Reguler' OR paket_pengajaran = '09:00');",
            "UPDATE program_settings SET nama_program = 'Sempoa SIP (8 Sesi)' WHERE nama_program = 'Sempoa SIP';",
            "INSERT INTO program_settings (nama_program, biaya_spp, target_pertemuan, jam_mulai, jam_selesai, hari_masuk, keterangan) SELECT 'Sempoa SIP (12 Sesi)', biaya_spp, 12, jam_mulai, jam_selesai, hari_masuk, 'Program Resmi Sempoa SIP - Paket 12 Sesi' FROM program_settings WHERE nama_program = 'Sempoa SIP (8 Sesi)' ON CONFLICT (nama_program) DO NOTHING;",
            "ALTER TABLE absensi_log ADD COLUMN IF NOT EXISTS status_denda VARCHAR(20) DEFAULT 'BELUM_LUNAS';"
        ]

        for sql_stmt in auto_sqls:
            try:
                with engine.connect() as conn:
                    conn.execute(text(sql_stmt))
                    conn.commit()
            except Exception as e_sql:
                logger.debug(f"Auto-migration statement notice: {e_sql}")

        logger.info("Auto-migration: Finished executing independent schema sync queries")

        # Auto-migration for bukti_transfer (ensure table exists on any DB engine)
        try:
            with engine.connect() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS bukti_transfer (
                        id SERIAL PRIMARY KEY,
                        id_pembayaran INTEGER NOT NULL,
                        file_path VARCHAR(255) NOT NULL,
                        status VARCHAR(50) NOT NULL DEFAULT 'pending',
                        admin_note VARCHAR(255),
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                """))
                conn.commit()
                logger.info("Auto-migration: Ensured bukti_transfer table exists")
        except Exception as bt_e:
            logger.warning(f"Auto-migration for bukti_transfer: {bt_e}")

        # Auto-normalize legacy 'Bulan YYYY' to 'YYYY-MM' in pembayaran_periode
        try:
            from app.models.pembayaran_periode import PembayaranPeriode
            db_norm = SessionLocal()
            legacy_pays = db_norm.query(PembayaranPeriode).all()
            bulan_map = {
                "januari": "01", "january": "01", "februari": "02", "february": "02",
                "maret": "03", "march": "03", "april": "04", "mei": "05", "may": "05",
                "juni": "06", "june": "06", "juli": "07", "july": "07",
                "agustus": "08", "august": "08", "september": "09", "oktober": "10",
                "october": "10", "november": "11", "desember": "12", "december": "12"
            }
            updated = False
            for p in legacy_pays:
                if p.periode_bulan and "-" not in p.periode_bulan:
                    parts = p.periode_bulan.strip().split()
                    if len(parts) == 2:
                        m_name = parts[0].lower()
                        y_str = parts[1]
                        if m_name in bulan_map and y_str.isdigit() and len(y_str) == 4:
                            p.periode_bulan = f"{y_str}-{bulan_map[m_name]}"
                            updated = True
            if updated:
                db_norm.commit()
                logger.info("Auto-migration: Normalized legacy periode_bulan records to YYYY-MM")
            db_norm.close()
        except Exception as norm_err:
            logger.warning(f"Legacy periode_bulan normalization: {norm_err}")

        # Clean up orphan PENDING_VERIFIKASI records that have no BuktiTransfer attached
        try:
            with engine.connect() as conn:
                conn.execute(text("""
                    UPDATE pembayaran_periode
                    SET status = 'MENUNGGAK'
                    WHERE status = 'PENDING_VERIFIKASI'
                      AND id NOT IN (SELECT DISTINCT id_pembayaran FROM bukti_transfer);
                """))
                conn.commit()
                logger.info("Auto-migration: Reconciled orphan PENDING_VERIFIKASI records")
        except Exception as cl_e:
            logger.debug(f"Orphan payment cleanup notice: {cl_e}")

        # Pastikan tidak ada log kehadiran Direktur / Fleksibel yang berstatus TERLAMBAT
        try:
            with engine.connect() as conn:
                conn.execute(text("""
                    UPDATE absensi_log
                    SET status = 'HADIR'
                    WHERE status = 'TERLAMBAT'
                      AND (
                        REPLACE(UPPER(uid), ' ', '') IN (
                            SELECT REPLACE(UPPER(uid), ' ', '') FROM guru
                            WHERE is_deleted = FALSE AND (
                                LOWER(kategori_program) LIKE '%direktur%'
                                OR LOWER(nama) LIKE '%direktur%'
                                OR LOWER(nama) LIKE '%zulhemawati%'
                            )
                        )
                      );
                """))
                conn.commit()
                logger.info("Auto-migration: Reconciled Direktur attendance logs to HADIR")
        except Exception as dir_err:
            logger.debug(f"Direktur attendance reconciliation notice: {dir_err}")

        # Rekonsiliasi Otomatis Status Keterlambatan Guru di Database sesuai aturan resmi:
        # - Guru yang masuk <= 08:00 WIB (atau memenuhi batas toleransi jadwal khusus) dikembalikan ke HADIR
        try:
            from app.models.guru import Guru
            from app.models.absensi_log import AbsensiLog, StatusAbsensi
            from app.services.attendance_rules import check_is_guru_late, WIB
            
            with SessionLocal() as db_session:
                all_gurus = db_session.query(Guru).filter(Guru.is_deleted == False).all()
                guru_dict = {}
                for g in all_gurus:
                    if g.uid:
                        guru_dict[g.uid.strip().upper().replace(" ", "")] = g
                
                late_logs = db_session.query(AbsensiLog).filter(AbsensiLog.status == StatusAbsensi.TERLAMBAT).all()
                reconciled_count = 0
                for l_log in late_logs:
                    clean_u = l_log.uid.strip().upper().replace(" ", "") if l_log.uid else ""
                    matched_g = guru_dict.get(clean_u)
                    if matched_g:
                        w_wib = l_log.waktu.astimezone(WIB) if l_log.waktu.tzinfo else l_log.waktu.replace(tzinfo=WIB)
                        if not check_is_guru_late(matched_g, w_wib):
                            l_log.status = StatusAbsensi.HADIR
                            reconciled_count += 1
                if reconciled_count > 0:
                    db_session.commit()
                    logger.info(f"Auto-migration: Reconciled {reconciled_count} false-late teacher attendance records to HADIR")
        except Exception as late_rec_err:
            logger.debug(f"Teacher attendance reconciliation notice: {late_rec_err}")

        # Rekonsiliasi Otomatis: Pemisahan Jadwal Kelas per Pengajar/Guru (1 baris mandiri per guru)
        try:
            from app.models.jadwal import Jadwal
            from app.models.guru import Guru
            from app.models.siswa import Siswa
            from app.api.v1.endpoints.jadwal import is_student_assigned_to_teacher
            with SessionLocal() as db_session:
                all_active_siswas = db_session.query(Siswa).filter(Siswa.is_deleted == False).all()
                multi_teacher_schedules = db_session.query(Jadwal).filter(Jadwal.guru_ids.like("%,%")).all()
                split_count = 0
                for sched in multi_teacher_schedules:
                    raw_ids = [int(x.strip()) for x in sched.guru_ids.split(",") if x.strip().isdigit()]
                    if len(raw_ids) > 1:
                        # Pengajar 1 tetap memegang jadwal ID lama dengan murid bimbingannya sendiri
                        t1 = db_session.query(Guru).filter(Guru.id == raw_ids[0]).first()
                        sched.id_guru = raw_ids[0]
                        sched.guru_ids = str(raw_ids[0])
                        if t1 and t1.hari_wajib:
                            sched.hari = t1.hari_wajib

                        real_s1 = [
                            s for s in all_active_siswas
                            if is_student_assigned_to_teacher(s, raw_ids[0], sched.kategori_program or "", db=db_session)
                        ]
                        sched.id_siswa = real_s1[0].id if real_s1 else None
                        sched.siswa_ids = ", ".join(str(s.id) for s in real_s1) if real_s1 else None

                        # Pengajar lainnya mendapatkan baris jadwal mandiri tersendiri dengan murid bimbingan mereka sendiri
                        for other_id in raw_ids[1:]:
                            t_other = db_session.query(Guru).filter(Guru.id == other_id).first()
                            existing = db_session.query(Jadwal).filter(
                                Jadwal.id_guru == other_id,
                                Jadwal.kategori_program == sched.kategori_program
                            ).first()
                            if not existing:
                                real_other_s = [
                                    s for s in all_active_siswas
                                    if is_student_assigned_to_teacher(s, other_id, sched.kategori_program or "", db=db_session)
                                ]
                                new_sched = Jadwal(
                                    id_guru=other_id,
                                    guru_ids=str(other_id),
                                    id_siswa=real_other_s[0].id if real_other_s else None,
                                    siswa_ids=", ".join(str(s.id) for s in real_other_s) if real_other_s else None,
                                    hari=t_other.hari_wajib if (t_other and t_other.hari_wajib) else sched.hari,
                                    jam_mulai=sched.jam_mulai,
                                    jam_selesai=sched.jam_selesai,
                                    lokasi=sched.lokasi,
                                    is_hari_libur=sched.is_hari_libur,
                                    kategori_program=sched.kategori_program,
                                    mode_kelas=sched.mode_kelas
                                )
                                db_session.add(new_sched)
                                split_count += 1
                        db_session.commit()
                if split_count > 0:
                    logger.info(f"Auto-migration: Successfully split multi-teacher schedules into {split_count} independent teacher schedules")

                # Sinkronkan seluruh jadwal kelas yang ada di database agar HANYA memuat murid riil
                all_schedules = db_session.query(Jadwal).all()
                logger.info(f"Auto-migration: Reconciling {len(all_schedules)} class schedules with genuine student assignments...")
                reconciled_sched_count = 0
                for s_row in all_schedules:
                    teacher_id = s_row.id_guru
                    if not teacher_id and s_row.guru_ids:
                        parts = [int(x.strip()) for x in s_row.guru_ids.split(",") if x.strip().isdigit()]
                        if parts:
                            teacher_id = parts[0]

                    real_s = []
                    if teacher_id and s_row.kategori_program:
                        real_s = [
                            s for s in all_active_siswas
                            if is_student_assigned_to_teacher(s, teacher_id, s_row.kategori_program, db=db_session)
                        ]

                    new_sids_str = ", ".join(str(s.id) for s in real_s) if real_s else None
                    new_first_id = real_s[0].id if real_s else None

                    if s_row.siswa_ids != new_sids_str or s_row.id_siswa != new_first_id:
                        s_row.siswa_ids = new_sids_str
                        s_row.id_siswa = new_first_id
                        reconciled_sched_count += 1

                if reconciled_sched_count > 0:
                    db_session.commit()
                    logger.info(f"Auto-migration: Successfully cleaned and reconciled {reconciled_sched_count} schedule rows with genuine student lists")
                else:
                    logger.info("Auto-migration: All class schedules are already in sync with genuine student lists")

                # =========================================================================
                # BLOK AUTO-DEDUPLIKASI DIHAPUS PERMANEN (11 Sep 2026)
                # Alasan: Blok ini otomatis menghapus data Jadwal, Guru, dan Siswa
                # setiap kali backend restart. Ini BERBAHAYA untuk sistem produksi.
                # Jika perlu deduplikasi, lakukan MANUAL via endpoint admin.
                # =========================================================================
        except Exception as split_err:
            logger.warning(f"Jadwal split & reconciliation notice: {split_err}")

        run_seed()

        # Seed default program settings and sync TK parity
        try:
            from app.models.program_setting import ProgramSetting
            from app.models.siswa import Siswa
            from app.models.users import User, UserRole
            from app.models.pembayaran_periode import PembayaranPeriode
            from app.core.security import get_password_hash
            from app.core.constants import PROGRAM_CONFIG

            db_prog = SessionLocal()
            for prog_name, p_info in PROGRAM_CONFIG.items():
                existing_ps = db_prog.query(ProgramSetting).filter(ProgramSetting.nama_program == prog_name).first()
                if not existing_ps:
                    new_ps = ProgramSetting(
                        nama_program=prog_name,
                        biaya_spp=p_info.get("biaya_spp", 200000.0),
                        target_pertemuan=p_info.get("default_target_pertemuan", 12),
                        jam_mulai=p_info.get("jam_default", {}).get("mulai", "08:00"),
                        jam_selesai=p_info.get("jam_default", {}).get("selesai", "12:00"),
                        hari_masuk=p_info.get("hari_masuk", "Senin - Jumat"),
                        keterangan=f"Program Resmi {prog_name}"
                    )
                    db_prog.add(new_ps)
                else:
                    # Sync TK to 400k, 20 target, 07:30 - 13:30 if still default 200k / 0
                    if prog_name == "TK" and (float(existing_ps.biaya_spp) != 400000.0 or existing_ps.target_pertemuan != 20):
                        existing_ps.biaya_spp = 400000.00
                        existing_ps.target_pertemuan = 20
                        existing_ps.jam_mulai = "07:30"
                        existing_ps.jam_selesai = "13:30"
                        existing_ps.hari_masuk = "Senin - Jumat"
            db_prog.commit()

            # Auto-sync existing TK students in database: set target 20, hours 07:30-13:30, and auto-provision Ortu accounts
            tk_students = db_prog.query(Siswa).filter(
                Siswa.is_deleted == False,
                func.lower(Siswa.kategori_program).like('%tk%')
            ).all()

            for s_tk in tk_students:
                if not s_tk.target_pertemuan or s_tk.target_pertemuan == 0:
                    s_tk.target_pertemuan = 20
                    s_tk.sisa_pertemuan = 20
                if not s_tk.hari_masuk:
                    s_tk.hari_masuk = "Senin, Selasa, Rabu, Kamis, Jumat"
                if not s_tk.paket_jadwal:
                    s_tk.paket_jadwal = "Senin - Jumat 07:30 - 13:30 WIB"

                # Update any 0 amount payments for TK to 400,000
                tk_pays = db_prog.query(PembayaranPeriode).filter(PembayaranPeriode.id_siswa == s_tk.id).all()
                for tp in tk_pays:
                    if float(tp.jumlah or 0) == 0:
                        tp.jumlah = 400000.00

                # Provision Ortu account if missing
                has_ortu = db_prog.query(User).filter(
                    User.role == UserRole.ortu,
                    User.uid_terhubung == str(s_tk.id)
                ).first()
                if not has_ortu:
                    base_nick = (s_tk.nama_panggilan or s_tk.nama or "siswa").lower().replace(" ", "")
                    clean_prefix = "".join(c for c in base_nick if c.isalnum()) or "tk"
                    cand_email = f"{clean_prefix}@sempoasippariaman.com"
                    suf = 1
                    while db_prog.query(User).filter(func.lower(User.email) == cand_email.lower()).first():
                        suf += 1
                        cand_email = f"{clean_prefix}{suf}@sempoasippariaman.com"

                    ortu_u = User(
                        email=cand_email,
                        password=get_password_hash("sempoa123"),
                        role=UserRole.ortu,
                        nama=s_tk.nama_orang_tua or f"Ortu {s_tk.nama}",
                        uid_terhubung=str(s_tk.id)
                    )
                    db_prog.add(ortu_u)
                    logger.info(f"Auto-provisioned Ortu account for TK student {s_tk.nama}: {cand_email}")

            db_prog.commit()
            db_prog.close()
        except Exception as prog_sync_err:
            logger.warning(f"Program settings & TK sync notice: {prog_sync_err}")

        # Start SPP background reminder scheduler
        from app.services.scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        logger.error(f"Startup initialization error: {e}")

@app.on_event("shutdown")
def on_shutdown():
    from app.services.scheduler import shutdown_scheduler
    shutdown_scheduler()

# CORS Middleware (production strict whitelist vs dev fallback)
cors_kwargs = {
    "allow_origins": settings.allowed_origins,
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["*"],
}
if settings.fastapi_env != "production":
    cors_kwargs["allow_origin_regex"] = r"http://(localhost|127\.0\.0\.1)(:\d+)?"

from app.core.middleware import GlobalRateLimitMiddleware

app.add_middleware(
    GlobalRateLimitMiddleware,
    auth_limit=600,
    unauth_limit=150,
    window_seconds=60
)
app.add_middleware(CORSMiddleware, **cors_kwargs)

# Mount static files for uploads
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "bukti_transfer"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "profil"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "galeri"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# Health check endpoint
@app.get("/health")
async def health_check(db=Depends(get_db)):
    """
    Health check with database connectivity test.
    Returns 500 if Postgres is down.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "degraded", "database": "disconnected", "error": str(e)}
        )

from app.api.v1.endpoints.hardware import router as hardware_router
from app.api.v1.router import api_router

app.include_router(hardware_router, prefix="/api")
app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["/app/app"]
    )
