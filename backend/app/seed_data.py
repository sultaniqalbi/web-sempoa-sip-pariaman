import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.users import User, UserRole

import os
from app.core.security import generate_random_password

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
    Idempotently seed Admin and Owner accounts into the database if not exists.
    Preserves user passwords if account already exists.
    """
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
        
    try:
        for seed_user in SEED_USERS:
            target_email = seed_user["email"]
            
            # Case-insensitive lookup
            existing_user = db.query(User).filter(
                func.lower(User.email) == target_email.lower()
            ).first()
            
            if existing_user:
                # If explicit seed password env is set, sync password
                if (seed_user["role"] == UserRole.admin and "ADMIN_SEED_PASSWORD" in os.environ) or \
                   (seed_user["role"] == UserRole.owner and "OWNER_SEED_PASSWORD" in os.environ):
                    if not verify_password(seed_user["password"], existing_user.password):
                        existing_user.password = get_password_hash(seed_user["password"])
                        logger.info(f"Updated seed password for: {target_email}")
                logger.info(f"Verified existing user account: {target_email} ({seed_user['role'].value})")
                existing_user.email = target_email
                existing_user.role = seed_user["role"]
                existing_user.nama = seed_user["nama"]
            else:
                hashed_pwd = get_password_hash(seed_user["password"])
                logger.warning(f"Creating new seed user: {target_email} ({seed_user['role'].value})")
                new_user = User(
                    email=target_email,
                    password=hashed_pwd,
                    role=seed_user["role"],
                    nama=seed_user["nama"]
                )
                db.add(new_user)
                
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
    print("Running seed_data script...")
    run_seed()
    print("Seed completed.")
