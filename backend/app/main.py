from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.core.database import get_db
from sqlalchemy import text

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
              );"""
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

        run_seed()

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
