from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.rate_limit import login_limiter
from app.models.users import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, UserProfileSchema
from app.core.dependencies import get_current_user

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


from sqlalchemy import func

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    email = login_data.email.strip()

    # 1. Rate limiting check
    login_limiter.check_rate_limit(client_ip, email)

    # 2. Query user (case-insensitive email matching)
    user = db.query(User).filter(func.lower(User.email) == email.lower()).first()

    
    # 3. Verify password
    if not user or not verify_password(login_data.password, user.password):
        # Record failure
        login_limiter.record_failure(client_ip, email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Success - Reset rate limiting
    login_limiter.reset_attempts(client_ip, email)

    # 5. Generate tokens
    access_token = create_access_token(subject=user.email)
    refresh_token = create_refresh_token(subject=user.email)

    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
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

