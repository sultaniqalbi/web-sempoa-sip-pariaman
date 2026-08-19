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

app.add_middleware(CORSMiddleware, **cors_kwargs)
app.add_middleware(GlobalRateLimitMiddleware)

# Mount static files for uploads
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
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
        return {"status": "degraded", "database": "disconnected", "error": str(e)}, 500

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
