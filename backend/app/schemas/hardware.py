from pydantic import BaseModel, field_validator
from datetime import datetime

class AbsensiRequest(BaseModel):
    uid: str
    waktu: str
    mode: str = "ONLINE"

    @field_validator("uid")
    @classmethod
    def validate_uid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ERROR_UID_KOSONG")
        return v.strip().upper()

    @field_validator("waktu")
    @classmethod
    def validate_waktu(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ERROR_WAKTU_KOSONG")
        try:
            datetime.strptime(v.strip(), "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise ValueError("ERROR_WAKTU_FORMAT")
        return v.strip()
