from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class EvaluasiBase(BaseModel):
    id_siswa: int
    id_guru: Optional[int] = None
    kategori_program: str
    tanggal_evaluasi: date
    periode_evaluasi: Optional[str] = None
    nilai_fokus: str = "Baik"
    nilai_kecepatan: str = "Baik"
    nilai_ketelitian: str = "Baik"
    nilai_pemahaman: str = "Baik"
    predikat_keseluruhan: str = "Baik"
    catatan_guru: str
    saran_untuk_ortu: Optional[str] = None

class EvaluasiCreate(EvaluasiBase):
    pass

class EvaluasiUpdate(BaseModel):
    id_guru: Optional[int] = None
    kategori_program: Optional[str] = None
    tanggal_evaluasi: Optional[date] = None
    periode_evaluasi: Optional[str] = None
    nilai_fokus: Optional[str] = None
    nilai_kecepatan: Optional[str] = None
    nilai_ketelitian: Optional[str] = None
    nilai_pemahaman: Optional[str] = None
    predikat_keseluruhan: Optional[str] = None
    catatan_guru: Optional[str] = None
    saran_untuk_ortu: Optional[str] = None

class EvaluasiResponse(EvaluasiBase):
    id: int
    created_at: datetime
    nama_siswa: Optional[str] = None
    uid_siswa: Optional[str] = None
    nama_guru: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
