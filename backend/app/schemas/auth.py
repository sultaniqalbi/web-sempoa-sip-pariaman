from typing import Optional
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfileSchema(BaseModel):
    id: int
    email: str
    nama: str
    role: str
    uid_terhubung: Optional[str] = None
    foto_profil: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    email: str
    role: str
    nama: str
    user: Optional[UserProfileSchema] = None

class RefreshRequest(BaseModel):
    refresh_token: str
