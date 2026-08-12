from typing import Optional
from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserProfileSchema(BaseModel):
    id: int
    email: str
    nama: str
    role: str

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
