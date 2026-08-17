from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base

class Galeri(Base):
    __tablename__ = "galeri"

    id = Column(Integer, primary_key=True, index=True)
    judul = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    deskripsi = Column(Text, nullable=True)
    is_highlighted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
