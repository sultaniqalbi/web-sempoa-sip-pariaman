import os
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, verify_password, generate_random_password
from app.models.users import User, UserRole

logger = logging.getLogger("seed_data")

# Password dari env var — TIDAK ADA default hardcoded di source code
ADMIN_SEED_PWD = os.getenv("ADMIN_SEED_PASSWORD")
OWNER_SEED_PWD = os.getenv("OWNER_SEED_PASSWORD")

SEED_USERS = [
    {
        "email": "0b11010F8C@sempoasippariaman.com",
        "env_var": "ADMIN_SEED_PASSWORD",
        "password": ADMIN_SEED_PWD,
        "role": UserRole.admin,
        "nama": "Admin SIP Pariaman"
    },
    {
        "email": "0xA7F3B9E2@sempoasippariaman.com",
        "env_var": "OWNER_SEED_PASSWORD",
        "password": OWNER_SEED_PWD,
        "role": UserRole.owner,
        "nama": "Owner SIP Pariaman"
    }
]

def run_seed(db: Session = None):
    """
    Seed/Sync Admin & Owner accounts di database.
    """
    Base.metadata.create_all(bind=engine)

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        for seed_user in SEED_USERS:
            target_email = seed_user["email"]

            existing_user = db.query(User).filter(
                func.lower(User.email) == target_email.lower()
            ).first()

            if existing_user:
                if seed_user["password"]:
                    existing_user.password = get_password_hash(seed_user["password"])
                existing_user.role = seed_user["role"]
                existing_user.nama = seed_user["nama"]
                logger.info(f"Verified seed user: {target_email}")
            else:
                pwd = seed_user["password"] or generate_random_password()
                hashed_pwd = get_password_hash(pwd)
                new_user = User(
                    email=target_email,
                    password=hashed_pwd,
                    role=seed_user["role"],
                    nama=seed_user["nama"]
                )
                db.add(new_user)
                logger.info(f"Created seed user: {target_email}")

        db.commit()
        logger.info("Seed data verification completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during seed_data execution: {e}")
    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_seed()
