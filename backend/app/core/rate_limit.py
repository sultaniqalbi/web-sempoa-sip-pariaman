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

# Global instance (7 attempts per IP + email per 10 minutes)
login_limiter = LoginRateLimiter(limit_attempts=7, window_seconds=600)


class HardwareRateLimiter:
    """
    Rate limiter for ESP32 hardware endpoints:
    - 120 req/IP/min for normal requests
    - 10 failed auth attempts/IP/5min for brute-force prevention
    """
    def __init__(self, normal_limit: int = 120, normal_window: int = 60, fail_limit: int = 10, fail_window: int = 300):
        self.normal_limit = normal_limit
        self.normal_window = normal_window
        self.fail_limit = fail_limit
        self.fail_window = fail_window
        self.in_memory_requests: Dict[str, List[float]] = {}
        self.in_memory_fails: Dict[str, List[float]] = {}

    def is_rate_limited(self, ip: str) -> bool:
        """Check if request rate exceeds 120 req/min"""
        key = f"ratelimit:hardware:req:{ip}"
        now = time.time()
        if redis_client:
            try:
                count = redis_client.zcount(key, now - self.normal_window, "+inf")
                if count >= self.normal_limit:
                    return True
                pipe = redis_client.pipeline()
                pipe.zadd(key, {str(now): now})
                pipe.zremrangebyscore(key, "-inf", now - self.normal_window)
                pipe.expire(key, self.normal_window)
                pipe.execute()
                return False
            except Exception as e:
                logger.error(f"Redis hardware rate limit error: {e}")

        # In-memory fallback
        if ip not in self.in_memory_requests:
            self.in_memory_requests[ip] = []
        self.in_memory_requests[ip] = [t for t in self.in_memory_requests[ip] if now - t < self.normal_window]
        if len(self.in_memory_requests[ip]) >= self.normal_limit:
            return True
        self.in_memory_requests[ip].append(now)
        return False

    def is_auth_blocked(self, ip: str) -> bool:
        """Check if IP is blocked due to excessive failed API key attempts"""
        key = f"ratelimit:hardware:fail:{ip}"
        now = time.time()
        if redis_client:
            try:
                count = redis_client.zcount(key, now - self.fail_window, "+inf")
                return count >= self.fail_limit
            except Exception as e:
                logger.error(f"Redis hardware auth block check error: {e}")

        if ip in self.in_memory_fails:
            self.in_memory_fails[ip] = [t for t in self.in_memory_fails[ip] if now - t < self.fail_window]
            return len(self.in_memory_fails[ip]) >= self.fail_limit
        return False

    def record_auth_failure(self, ip: str) -> None:
        """Record invalid API key attempt"""
        key = f"ratelimit:hardware:fail:{ip}"
        now = time.time()
        if redis_client:
            try:
                pipe = redis_client.pipeline()
                pipe.zadd(key, {str(now): now})
                pipe.zremrangebyscore(key, "-inf", now - self.fail_window)
                pipe.expire(key, self.fail_window)
                pipe.execute()
                return
            except Exception as e:
                logger.error(f"Redis hardware auth fail record error: {e}")

        if ip not in self.in_memory_fails:
            self.in_memory_fails[ip] = []
        self.in_memory_fails[ip].append(now)

    def reset_auth_failures(self, ip: str) -> None:
        """Reset failed attempts upon valid request"""
        key = f"ratelimit:hardware:fail:{ip}"
        if redis_client:
            try:
                redis_client.delete(key)
            except Exception:
                pass
        if ip in self.in_memory_fails:
            del self.in_memory_fails[ip]

hardware_limiter = HardwareRateLimiter()
