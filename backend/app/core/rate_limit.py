import hashlib
from typing import Callable
from fastapi import HTTPException, Request, status
from app.core.client_ip import get_client_ip
from app.core.config import settings
from app.db.redis import safe_redis
from app.core.redis_scripts import atomic_incr_expire, atomic_sliding_window
from app.core.logging_config import get_logger

logger = get_logger("app.rate_limit")


def rate_limiter(requests_limit: int = 60, window_seconds: int = 60) -> Callable:
    """Sliding window rate limiter using atomic Redis Lua script."""

    async def dependency(request: Request) -> None:
        redis = safe_redis()
        if not redis:
            return

        client_ip = get_client_ip(request)
        route_key = f"rate_limit:{client_ip}:{request.url.path}"

        try:
            is_allowed, current_count = await atomic_sliding_window(
                redis_client=redis,
                key=route_key,
                requests_limit=requests_limit,
                window_seconds=window_seconds,
            )
            if not is_allowed:
                logger.warning("Rate limit exceeded for %s on %s (count: %d)", client_ip, request.url.path, current_count)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please wait before retrying.",
                    headers={"Retry-After": str(window_seconds)},
                )
        except HTTPException:
            raise
        except Exception as err:
            logger.debug("Redis rate limiter check error: %s", err)
            return

    return dependency


AUTH_WINDOW_SECONDS = 60
# One address trying one identity: stops grinding a single account and emailing a single inbox over and over.
AUTH_ATTEMPTS_PER_IDENTITY = 10
# Everything from one address: a flood ceiling. It is high on purpose, because a whole classroom or campus can
# share one public address and must be able to sign in together.
AUTH_ATTEMPTS_PER_ADDRESS = 120


def _identity_digest(identity: str) -> str:
    return hashlib.sha256(identity.strip().lower().encode()).hexdigest()[:24]


async def limit_auth_attempts(request: Request, scope: str, identity: str) -> None:
    """Throttles an authentication call by who is being attempted, then by the address as a flood ceiling.

    `identity` is what the caller is acting on (a login ID, an email, a one-time token). It is hashed, so no
    email address or token ever sits in a Redis key. Wrong passwords on one account are limited separately by
    the account lockout.
    """
    if settings.ENVIRONMENT == "development":
        return
    redis = safe_redis()
    if not redis:
        return
    address = get_client_ip(request)
    buckets = (
        (f"ratelimit:auth:{scope}:identity:{address}:{_identity_digest(identity)}", AUTH_ATTEMPTS_PER_IDENTITY),
        (f"ratelimit:auth:{scope}:address:{address}", AUTH_ATTEMPTS_PER_ADDRESS),
    )
    try:
        for key, limit in buckets:
            if await atomic_incr_expire(redis, key, AUTH_WINDOW_SECONDS) > limit:
                logger.warning("Auth rate limit exceeded: scope=%s address=%s", scope, address)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                    headers={"Retry-After": str(AUTH_WINDOW_SECONDS)},
                )
    except HTTPException:
        raise
    except Exception as err:
        logger.warning("Auth rate limit error: %s", err)
