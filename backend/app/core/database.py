import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

def get_database_url() -> str:
    url = settings.database_url
    # If running outside docker container on Windows host, fallback to localhost:5433
    if not os.path.exists('/.dockerenv') and "@db:5432" in url:
        url = url.replace("db:5432", "localhost:5433")
    return url

engine = create_engine(
    get_database_url(),
    echo=(settings.fastapi_env == "development"),
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
