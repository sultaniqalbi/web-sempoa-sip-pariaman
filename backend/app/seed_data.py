import os
import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, verify_password, generate_random_password
from app.models.users import User, UserRole

logger = logging.getLogger("seed_data")

# Password dari env var — TIDAK ADA default hardcoded di source code
ADMIN_SEED_PWD = os.getenv("ADMIN_SEED_PASSWORD", "Z6@s#Ax7")
OWNER_SEED_PWD = os.getenv("OWNER_SEED_PASSWORD", "8W&x#I2m")

SEED_USERS = [
    {
        "email": "AdminSip@sempoasippariaman.com",
        "password": ADMIN_SEED_PWD,
        "role": UserRole.admin,
        "nama": "Admin SIP Pariaman"
    },
    {
        "email": "OwNerSiP@sempoasippariaman.com",
        "password": OWNER_SEED_PWD,
        "role": UserRole.owner,
        "nama": "Owner SIP Pariaman"
    }
]

def run_seed(db: Session = None):
    """
    Seed Admin & Owner accounts. Password dari env var atau default fallback.
    Mensejajarkan password akun jika belum cocok.
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
                # Sync password jika hash tidak cocok dengan seed password
                if not verify_password(seed_user["password"], existing_user.password):
                    existing_user.password = get_password_hash(seed_user["password"])
                    logger.info(f"Password synced for: {target_email}")
                existing_user.role = seed_user["role"]
                existing_user.nama = seed_user["nama"]
                logger.info(f"Verified seed user: {target_email}")
            else:
                hashed_pwd = get_password_hash(seed_user["password"])
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
