import json
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from pywebpush import webpush, WebPushException

from app.core.config import settings
from app.models.push_subscription import PushSubscription
from app.models.audit_log import AuditLog
from app.models.users import User

logger = logging.getLogger("push_notification")

def send_push_to_user(
    db: Session,
    user_id: int,
    title: str,
    body: str,
    url: Optional[str] = None,
    icon: Optional[str] = None
) -> dict:
    """
    Kirim notifikasi web push ke seluruh perangkat terdaftar milik seorang user.
    Auto-cleanup jika subscription kadaluarsa (HTTP 410 / 404).
    """
    if not settings.vapid_private_key or not settings.vapid_public_key:
        logger.warning("VAPID keys belum dikonfigurasi. Web push dilewati.")
        return {"status": "skipped", "reason": "VAPID keys not configured"}

    subscriptions = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    if not subscriptions:
        return {"status": "no_subscriptions", "sent": 0}

    user = db.query(User).filter(User.id == user_id).first()
    user_email = user.email if user else f"user_{user_id}"
    user_role = user.role.value if user and hasattr(user.role, 'value') else "ortu"

    payload = json.dumps({
        "title": title,
        "body": body,
        "url": url or "/ortu/pembayaran",
        "icon": icon or "/assets/logo/logo-sempoa-sip.png",
        "badge": "/assets/logo/logo-sempoa-sip.png",
        "timestamp": datetime.utcnow().isoformat()
    })

    success_count = 0
    fail_count = 0
    cleaned_count = 0

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth
                    }
                },
                data=payload,
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject}
            )
            success_count += 1
        except WebPushException as ex:
            fail_count += 1
            status_code = ex.response.status_code if ex.response is not None else None
            logger.warning(f"Gagal mengirim Web Push ke user {user_id} (status: {status_code}): {ex}")
            # Auto-cleanup expired/unsubscribed subscriptions
            if status_code in (404, 410):
                try:
                    db.delete(sub)
                    cleaned_count += 1
                except Exception as del_err:
                    logger.error(f"Gagal menghapus stale push subscription: {del_err}")

    if cleaned_count > 0:
        try:
            db.commit()
            logger.info(f"Dibersihkan {cleaned_count} subscription kadaluarsa untuk user {user_id}")
        except Exception:
            db.rollback()

    # Record audit log
    try:
        audit = AuditLog(
            action="WEB_PUSH_NOTIFICATION",
            role=user_role,
            email=user_email,
            details={
                "title": title,
                "success_devices": success_count,
                "failed_devices": fail_count,
                "cleaned_devices": cleaned_count
            },
            status="SUCCESS" if success_count > 0 else ("FAILED" if fail_count > 0 else "NO_DEVICE")
        )
        db.add(audit)
        db.commit()
    except Exception:
        db.rollback()

    return {
        "status": "completed",
        "success": success_count,
        "failed": fail_count,
        "cleaned": cleaned_count
    }
