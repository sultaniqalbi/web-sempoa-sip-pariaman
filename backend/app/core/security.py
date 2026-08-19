from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        # Native bcrypt verification (bulletproof against passlib version bugs)
        pwd_bytes = plain_password[:72].encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        try:
            return pwd_context.verify(plain_password[:72], hashed_password)
        except Exception:
            return False


def get_password_hash(password: str) -> str:
    try:
        pwd_bytes = password[:72].encode('utf-8')
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    except Exception:
        clean_pwd = password[:72]
        return pwd_context.hash(clean_pwd)


import uuid

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    # SECURITY FIX: Embed unique token ID (jti) for revocation/blacklisting
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "jti": str(uuid.uuid4())
    }
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": str(uuid.uuid4())
    }
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except Exception:
        return None

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

PROTECTED_EMAILS = [
    "adminsip@sempoasippariaman.com",
    "ownersip@sempoasippariaman.com",
]

def is_protected_account(email: str) -> bool:
    if not email:
        return False
    return email.lower().strip() in PROTECTED_EMAILS

