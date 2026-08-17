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
    description="API for Sempoa SIP TC Pariaman attendance system"
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
        run_seed()
    except Exception as e:
        logger.error(f"Startup initialization error: {e}")

# CORS Middleware (supports domain, VPS IP, and localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins if isinstance(settings.allowed_origins, list) else ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|202\.155\.157\.22|.*sempoasippariaman\.com)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
