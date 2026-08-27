from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    owner = "owner"
    guru = "guru"
    ortu = "ortu"
    siswa = "siswa"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    plain_password = Column(String(100), nullable=True)  # Remembered password for WhatsApp credential push
    role = Column(SQLEnum(UserRole, name="user_role_enum"), nullable=False)
    nama = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    foto_profil = Column(String(255), nullable=True)
    uid_terhubung = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
