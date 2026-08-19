import os
import logging
import redis
from typing import Optional

logger = logging.getLogger("redis_cache")

# Fallback in-memory set if Redis is unavailable during local tests
_in_memory_blacklist = set()

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=0,
        decode_responses=True,
        socket_timeout=2.0,
        socket_connect_timeout=2.0
    )
    # Test connection non-blocking
    redis_client.ping()
    logger.info(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    logger.warning(f"Redis not available ({e}). Using in-memory fallback for rate limiting & token blacklist.")
    redis_client = None

def blacklist_token(jti: str, exp_seconds: int = 3600):
    """
    Add JWT token ID (jti) to blacklist with TTL matching token expiration.
    """
    if not jti:
        return
    try:
        if redis_client:
            redis_client.setex(f"blacklist:{jti}", max(1, exp_seconds), "1")
            return
    except Exception as e:
        logger.error(f"Redis error while blacklisting token: {e}")
    
    _in_memory_blacklist.add(jti)

def is_token_blacklisted(jti: str) -> bool:
    """
    Check if JWT token ID (jti) is in the revoked/blacklisted set.
    """
    if not jti:
        return False
    try:
        if redis_client:
            return bool(redis_client.exists(f"blacklist:{jti}"))
    except Exception as e:
        logger.error(f"Redis error checking token blacklist: {e}")
    
    return jti in _in_memory_blacklist
