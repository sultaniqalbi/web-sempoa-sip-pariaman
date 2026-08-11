import time
from typing import Dict, List
from fastapi import HTTPException, status

class LoginRateLimiter:
    def __init__(self, limit_attempts: int = 5, window_seconds: int = 900):
        self.limit_attempts = limit_attempts
        self.window_seconds = window_seconds
        self.attempts: Dict[str, List[float]] = {}

    def _get_key(self, ip: str, email: str) -> str:
        return f"{ip}:{email.lower().strip()}"

    def check_rate_limit(self, ip: str, email: str) -> None:
        key = self._get_key(ip, email)
        now = time.time()
        
        if key in self.attempts:
            # Keep only attempts within the window
            self.attempts[key] = [t for t in self.attempts[key] if now - t < self.window_seconds]
            if len(self.attempts[key]) >= self.limit_attempts:
                oldest = self.attempts[key][0]
                time_left = int(self.window_seconds - (now - oldest))
                time_left_min = max(1, time_left // 60)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Terlalu banyak percobaan login gagal. Silakan coba lagi dalam {time_left_min} menit."
                )

    def record_failure(self, ip: str, email: str) -> None:
        key = self._get_key(ip, email)
        now = time.time()
        if key not in self.attempts:
            self.attempts[key] = []
        self.attempts[key].append(now)

    def reset_attempts(self, ip: str, email: str) -> None:
        key = self._get_key(ip, email)
        if key in self.attempts:
            del self.attempts[key]

# Global instance (5 attempts per IP + email per 15 minutes)
login_limiter = LoginRateLimiter(limit_attempts=5, window_seconds=900)
