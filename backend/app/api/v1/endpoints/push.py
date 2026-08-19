import time
import logging
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.core.redis import redis_client
from app.models.users import User, UserRole
from app.models.push_subscription import PushSubscription
from app.schemas.push import PushSubscribeRequest, PushUnsubscribeRequest, VapidKeyResponse

logger = logging.getLogger(__name__)
router = APIRouter()

ortu_only = RoleChecker([UserRole.ortu])

ALLOWED_PUSH_DOMAINS = {
    "fcm.googleapis.com",
    "updates.push.services.mozilla.com",
    "push.services.mozilla.com",
    "notify.windows.com",
    "web.push.apple.com",
}

def check_subscribe_rate_limit(user_id: int) -> None:
    """Rate limit: 10 requests per user per hour"""
    key = f"ratelimit:push:subscribe:{user_id}"
    now = time.time()
    window = 3600
    limit = 10

    if redis_client:
        try:
            count = redis_client.zcount(key, now - window, "+inf")
            if count >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Terlalu banyak permintaan subscribe notifikasi. Silakan coba lagi nanti."
                )
            pipe = redis_client.pipeline()
            pipe.zadd(key, {str(now): now})
            pipe.zremrangebyscore(key, "-inf", now - window)
            pipe.expire(key, window)
            pipe.execute()
            return
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Redis subscribe rate limit error: {e}")

def validate_push_endpoint(endpoint: str) -> None:
    """Validate endpoint URL against known browser push service whitelist"""
    try:
        parsed = urlparse(endpoint)
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            raise ValueError("Hostname kosong")
        # Check domain or subdomain matching
        is_allowed = any(
            hostname == domain or hostname.endswith("." + domain)
            for domain in ALLOWED_PUSH_DOMAINS
        )
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Endpoint push service tidak valid atau tidak didukung."
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format endpoint URL push tidak valid."
        )

@router.get("/vapid-key", response_model=VapidKeyResponse)
async def get_vapid_public_key():
    """
    Public endpoint untuk mengambil VAPID Public Key untuk Service Worker Frontend.
    """
    return VapidKeyResponse(public_key=settings.vapid_public_key)

@router.post("/subscribe")
async def subscribe_push(
    sub_in: PushSubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(ortu_only)
):
    """
    Simpan atau perbarui subscription Web Push milik Orang Tua.
    - Maksimal 5 perangkat per akun ortu
    - Rate limit 10x per jam
    """
    check_subscribe_rate_limit(current_user.id)
    validate_push_endpoint(sub_in.endpoint)

    endpoint_str = sub_in.endpoint.strip()
    p256dh_str = sub_in.keys.p256dh.strip()
    auth_str = sub_in.keys.auth.strip()

    # Cek apakah subscription sudah ada
    existing_sub = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == endpoint_str
    ).first()

    if existing_sub:
        existing_sub.p256dh = p256dh_str
        existing_sub.auth = auth_str
        if sub_in.device_info:
            existing_sub.device_info = sub_in.device_info.strip()[:100]
        db.commit()
        return {"status": "success", "action": "updated", "message": "Subscription notifikasi diperbarui."}

    # Cek batas maksimal 5 perangkat
    current_count = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id
    ).count()

    if current_count >= 5:
        # Hapus subscription paling lama
        oldest_sub = db.query(PushSubscription).filter(
            PushSubscription.user_id == current_user.id
        ).order_by(PushSubscription.created_at.asc()).first()
        if oldest_sub:
            db.delete(oldest_sub)

    new_sub = PushSubscription(
        user_id=current_user.id,
        endpoint=endpoint_str,
        p256dh=p256dh_str,
        auth=auth_str,
        device_info=sub_in.device_info.strip()[:100] if sub_in.device_info else None
    )
    db.add(new_sub)
    db.commit()
    return {"status": "success", "action": "created", "message": "Perangkat berhasil didaftarkan untuk notifikasi push."}

@router.delete("/unsubscribe")
async def unsubscribe_push(
    unsub_in: PushUnsubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(ortu_only)
):
    """
    Hapus subscription Web Push saat user menonaktifkan notifikasi di browser.
    """
    sub = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == unsub_in.endpoint.strip()
    ).first()

    if sub:
        db.delete(sub)
        db.commit()
        return {"status": "success", "message": "Subscription notifikasi berhasil dihapus."}

    return {"status": "not_found", "message": "Subscription tidak ditemukan."}
