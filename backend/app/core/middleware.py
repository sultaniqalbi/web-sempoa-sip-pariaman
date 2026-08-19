import time
import logging
from typing import Dict, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from app.core.redis import redis_client

logger = logging.getLogger("global_rate_limiter")

class GlobalRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Global rate limiting middleware for FastAPI:
    - 200 requests/IP/minute for authenticated requests (Authorization: Bearer present)
    - 50 requests/IP/minute for unauthenticated requests
    - Skips: /health, /api/absensi, /api/ping (handled by hardware limiter), /ws, /stream, /uploads
    """
    def __init__(
        self,
        app,
        auth_limit: int = 200,
        unauth_limit: int = 50,
        window_seconds: int = 60
    ):
        super().__init__(app)
        self.auth_limit = auth_limit
        self.unauth_limit = unauth_limit
        self.window_seconds = window_seconds
        self.in_memory_records: Dict[str, List[float]] = {}

    def _is_rate_limited(self, ip: str, is_authenticated: bool) -> bool:
        limit = self.auth_limit if is_authenticated else self.unauth_limit
        rate_type = "auth" if is_authenticated else "unauth"
        key = f"ratelimit:global:{rate_type}:{ip}"
        now = time.time()

        if redis_client:
            try:
                count = redis_client.zcount(key, now - self.window_seconds, "+inf")
                if count >= limit:
                    return True
                pipe = redis_client.pipeline()
                pipe.zadd(key, {str(now): now})
                pipe.zremrangebyscore(key, "-inf", now - self.window_seconds)
                pipe.expire(key, self.window_seconds)
                pipe.execute()
                return False
            except Exception as e:
                logger.error(f"Redis global rate limit error: {e}")

        # In-memory fallback
        mem_key = f"{rate_type}:{ip}"
        if mem_key not in self.in_memory_records:
            self.in_memory_records[mem_key] = []
        self.in_memory_records[mem_key] = [
            t for t in self.in_memory_records[mem_key] if now - t < self.window_seconds
        ]
        if len(self.in_memory_records[mem_key]) >= limit:
            return True
        self.in_memory_records[mem_key].append(now)
        return False

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Whitelist paths that should bypass global rate limiting
        if (
            path == "/health"
            or path.startswith("/api/absensi")
            or path.startswith("/api/ping")
            or path.endswith("/ws")
            or path.endswith("/stream")
            or path.startswith("/uploads")
            or request.method == "OPTIONS"
        ):
            return await call_next(request)

        # Extract real client IP (behind reverse proxy like Nginx)
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

        auth_header = request.headers.get("Authorization") or ""
        is_authenticated = bool(auth_header.startswith("Bearer ") and len(auth_header) > 10)

        if self._is_rate_limited(client_ip, is_authenticated):
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Terlalu banyak permintaan ke server. Silakan tunggu beberapa saat lagi."
                },
                headers={"Retry-After": str(self.window_seconds)}
            )

        return await call_next(request)
