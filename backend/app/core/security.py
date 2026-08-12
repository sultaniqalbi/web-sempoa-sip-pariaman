from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password[:72], hashed_password)


def get_password_hash(password: str) -> str:
    clean_pwd = password[:72]
    return pwd_context.hash(clean_pwd)


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

import secrets
import string

def generate_random_password(length: int = 10) -> str:
    # Character pools avoiding ambiguous chars: 0/O, 1/l/I
    uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    lowers = "abcdefghijkmnpqrstuvwxyz"
    digits = "23456789"
    symbols = "@!#$%^&*"
    
    password = [
        secrets.choice(uppers),
        secrets.choice(lowers),
        secrets.choice(digits),
        secrets.choice(symbols)
    ]
    all_chars = uppers + lowers + digits + symbols
    for _ in range(length - 4):
        password.append(secrets.choice(all_chars))
        
    secrets.SystemRandom().shuffle(password)
    return "".join(password)

def normalize_whatsapp_number(wa: str) -> str:
    if not wa:
        return ""
    clean = wa.strip().replace(" ", "").replace("-", "").replace("+", "")
    if clean.startswith("0"):
        clean = "62" + clean[1:]
    elif not clean.startswith("62"):
        clean = "62" + clean
    return clean

