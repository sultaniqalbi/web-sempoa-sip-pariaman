import time
import logging
from typing import Dict, List
from fastapi import HTTPException, status
from app.core.redis import redis_client

logger = logging.getLogger("rate_limiter")

class LoginRateLimiter:
    def __init__(self, limit_attempts: int = 5, window_seconds: int = 900):
        self.limit_attempts = limit_attempts
        self.window_seconds = window_seconds
        self.in_memory_attempts: Dict[str, List[float]] = {}

    def _get_key(self, ip: str, email: str) -> str:
        return f"ratelimit:login:{ip}:{email.lower().strip()}"

    def check_rate_limit(self, ip: str, email: str) -> None:
        key = self._get_key(ip, email)
        now = time.time()
        
        # SECURITY FIX: Redis sliding window persistent across instances
        if redis_client:
            try:
                # Get attempts within the window
                attempts = redis_client.zrangebyscore(key, now - self.window_seconds, "+inf")
                if len(attempts) >= self.limit_attempts:
                    oldest = float(attempts[0])
                    time_left = int(self.window_seconds - (now - oldest))
                    time_left_min = max(1, time_left // 60)
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Terlalu banyak percobaan login gagal. Silakan coba lagi dalam {time_left_min} menit."
                    )
                return
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Redis rate limit check error: {e}")

        # Fallback to in-memory if Redis unavailable
        if key in self.in_memory_attempts:
            self.in_memory_attempts[key] = [t for t in self.in_memory_attempts[key] if now - t < self.window_seconds]
            if len(self.in_memory_attempts[key]) >= self.limit_attempts:
                oldest = self.in_memory_attempts[key][0]
                time_left = int(self.window_seconds - (now - oldest))
                time_left_min = max(1, time_left // 60)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Terlalu banyak percobaan login gagal. Silakan coba lagi dalam {time_left_min} menit."
                )

    def record_failure(self, ip: str, email: str) -> None:
        key = self._get_key(ip, email)
        now = time.time()
        
        if redis_client:
            try:
                pipe = redis_client.pipeline()
                pipe.zadd(key, {str(now): now})
                pipe.zremrangebyscore(key, "-inf", now - self.window_seconds)
                pipe.expire(key, self.window_seconds)
                pipe.execute()
                return
            except Exception as e:
                logger.error(f"Redis rate limit record error: {e}")

        if key not in self.in_memory_attempts:
            self.in_memory_attempts[key] = []
        self.in_memory_attempts[key].append(now)

    def reset_attempts(self, ip: str, email: str) -> None:
        key = self._get_key(ip, email)
        if redis_client:
            try:
                redis_client.delete(key)
            except Exception:
                pass
        if key in self.in_memory_attempts:
            del self.in_memory_attempts[key]

# Global instance (20 attempts per IP + email per 5 minutes)
login_limiter = LoginRateLimiter(limit_attempts=20, window_seconds=300)
