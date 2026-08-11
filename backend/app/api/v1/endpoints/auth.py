from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.rate_limit import login_limiter
from app.models.users import User
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest

router = APIRouter()

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

    # 2. Query user
    user = db.query(User).filter(User.email == email).first()
    
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

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        email=user.email,
        role=user.role,
        nama=user.nama
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

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        email=user.email,
        role=user.role,
        nama=user.nama
    )
