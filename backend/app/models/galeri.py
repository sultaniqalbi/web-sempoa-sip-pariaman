from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Galeri(Base):
    __tablename__ = "galeri"

    id = Column(Integer, primary_key=True, index=True)
    judul = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    deskripsi = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
