from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(50), nullable=False) # e.g. 'RESET_DATA', 'AUTO_PROVISION', 'LOGIN'
    role = Column(String(20), nullable=False)   # 'admin', 'owner', 'guru', 'ortu'
    email = Column(String(255), nullable=False) # executor email
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    details = Column(JSON, nullable=True)       # payload/metadata
    status = Column(String(20), nullable=False, default="SUCCESS") # 'SUCCESS', 'FAILED'
    backup_file = Column(String(255), nullable=True) # backup path for reset data
