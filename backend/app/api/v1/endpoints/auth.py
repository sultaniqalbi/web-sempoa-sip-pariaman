import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.rate_limit import login_limiter
from app.core.redis import blacklist_token, is_token_blacklisted
from app.core.dependencies import get_current_user, reusable_oauth2
from app.models.users import User
from app.models.audit_log import AuditLog
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, LogoutRequest, UserProfileSchema

router = APIRouter()

@router.get("/me", response_model=UserProfileSchema)
async def get_me(current_user: User = Depends(get_current_user)):
    role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    return UserProfileSchema(
        id=current_user.id,
        email=current_user.email,
        nama=current_user.nama,
        role=role_str,
        uid_terhubung=current_user.uid_terhubung,
        foto_profil=current_user.foto_profil,
        bio=current_user.bio,
        created_at=current_user.created_at.isoformat() if current_user.created_at else None
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    forwarded = request.headers.get("x-forwarded-for")
    real_ip = request.headers.get("x-real-ip")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif real_ip:
        client_ip = real_ip.strip()
    elif request.client:
        client_ip = request.client.host
    else:
        client_ip = "unknown"

    raw_email = login_data.email.strip()
    clean_email = raw_email.lower()

    # 1. Rate limiting check
    login_limiter.check_rate_limit(client_ip, clean_email)

    # 2. Query user (case-insensitive email & username matching)
    user = db.query(User).filter(
        (func.lower(User.email) == clean_email) |
        (func.lower(User.email) == f"{clean_email}@sempoasippariaman.com")
    ).first()

    # 3. Verify password
    if not user or not verify_password(login_data.password, user.password):
        # Record failure for rate limiting
        login_limiter.record_failure(client_ip, clean_email)
        # Record audit log failure
        try:
            audit = AuditLog(
                action="LOGIN_FAILURE",
                role="unknown" if not user else (user.role.value if hasattr(user.role, 'value') else str(user.role)),
                email=clean_email,
                details={"ip": client_ip, "reason": "Invalid credentials"},
                status="FAILED"
            )
            db.add(audit)
            db.commit()
        except Exception:
            db.rollback()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Success - Reset rate limiting
    login_limiter.reset_attempts(client_ip, clean_email)

    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)

    # Record audit log success
    try:
        audit = AuditLog(
            action="LOGIN_SUCCESS",
            role=role_str,
            email=user.email,
            details={"ip": client_ip},
            status="SUCCESS"
        )
        db.add(audit)
        db.commit()
    except Exception:
        db.rollback()

    # 5. Generate tokens
    access_token = create_access_token(subject=user.email)
    refresh_token = create_refresh_token(subject=user.email)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        email=user.email,
        role=role_str,
        nama=user.nama,
        user={
            "id": user.id,
            "email": user.email,
            "nama": user.nama,
            "role": role_str,
            "uid_terhubung": user.uid_terhubung,
            "foto_profil": user.foto_profil,
            "bio": user.bio,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    refresh_data: RefreshRequest,
    db: Session = Depends(get_db)
):
    token = refresh_data.refresh_token
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        token_type = payload.get("type")
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tipe token tidak valid"
            )
        jti = payload.get("jti")
        if not jti or is_token_blacklisted(jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token telah di-revoke atau tidak valid"
            )
        email = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kredensial token tidak valid"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token tidak valid atau telah kadaluarsa"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Pengguna tidak ditemukan"
        )

    # Invalidate old refresh token (rotate token)
    if jti:
        exp = payload.get("exp")
        ttl = (exp - int(time.time())) if exp else (settings.refresh_token_expire_days * 86400)
        blacklist_token(jti, max(1, ttl))

    # Create new pair
    new_access = create_access_token(subject=user.email)
    new_refresh = create_refresh_token(subject=user.email)

    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        email=user.email,
        role=role_str,
        nama=user.nama,
        user={
            "id": user.id,
            "email": user.email,
            "nama": user.nama,
            "role": role_str,
            "uid_terhubung": user.uid_terhubung,
            "foto_profil": user.foto_profil,
            "bio": user.bio,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    )

@router.post("/logout")
async def logout(
    request: Request,
    logout_data: Optional[LogoutRequest] = None,
    token: str = Depends(reusable_oauth2),
    db: Session = Depends(get_db)
):
    """
    SECURITY FIX: Revoke/Blacklist current user access token & refresh token.
    """
    client_ip = request.client.host if request.client else "unknown"
    user_email = "unknown"
    user_role = "unknown"

    # 1. Blacklist access token
    if token:
        try:
            payload = jwt.decode(
                token, settings.secret_key, algorithms=[settings.algorithm]
            )
            user_email = payload.get("sub", "unknown")
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti:
                ttl = (exp - int(time.time())) if exp else 3600
                blacklist_token(jti, max(1, ttl))
        except Exception:
            pass

    # 2. Blacklist refresh token if provided
    if logout_data and logout_data.refresh_token:
        try:
            ref_payload = jwt.decode(
                logout_data.refresh_token, settings.secret_key, algorithms=[settings.algorithm]
            )
            if user_email == "unknown":
                user_email = ref_payload.get("sub", "unknown")
            ref_jti = ref_payload.get("jti")
            ref_exp = ref_payload.get("exp")
            if ref_jti:
                ref_ttl = (ref_exp - int(time.time())) if ref_exp else (settings.refresh_token_expire_days * 86400)
                blacklist_token(ref_jti, max(1, ref_ttl))
        except Exception:
            pass

    # 3. Record AuditLog
    try:
        user = db.query(User).filter(User.email == user_email).first() if user_email != "unknown" else None
        if user:
            user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)

        audit = AuditLog(
            action="LOGOUT",
            role=user_role,
            email=user_email,
            details={"ip": client_ip},
            status="SUCCESS"
        )
        db.add(audit)
        db.commit()
    except Exception:
        db.rollback()

    return {"status": "success", "detail": "Sesi berhasil di-logout dan token telah di-revoke."}
