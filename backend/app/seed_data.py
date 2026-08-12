import logging
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.users import User, UserRole

logger = logging.getLogger("seed_data")

SEED_USERS = [
    {
        "email": "AdminSip@sempoasippariaman.com",
        "password": "Z6@s#Ax7",
        "role": UserRole.admin,
        "nama": "Admin SIP Pariaman"
    },
    {
        "email": "OwNerSiP@sempoasippariaman.com",
        "password": "8W&x#I2m",
        "role": UserRole.owner,
        "nama": "Owner SIP Pariaman"
    }
]

def run_seed(db: Session = None):
    """
    Idempotently seed Admin and Owner accounts into the database.
    Updates existing accounts if email (case-insensitive) matches, or inserts new accounts.
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
            hashed_pwd = get_password_hash(seed_user["password"])
            
            # Case-insensitive lookup
            existing_user = db.query(User).filter(
                func.lower(User.email) == target_email.lower()
            ).first()
            
            if existing_user:
                logger.info(f"Updating existing user: {target_email} ({seed_user['role'].value})")
                existing_user.email = target_email  # ensure exact case
                existing_user.password = hashed_pwd
                existing_user.role = seed_user["role"]
                existing_user.nama = seed_user["nama"]
            else:
                logger.info(f"Creating new seed user: {target_email} ({seed_user['role'].value})")
                new_user = User(
                    email=target_email,
                    password=hashed_pwd,
                    role=seed_user["role"],
                    nama=seed_user["nama"]
                )
                db.add(new_user)
                
        db.commit()
        logger.info("Seed data auto-provisioning completed successfully.")
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
