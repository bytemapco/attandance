from typing import Callable
from fastapi import HTTPException, Request, status
from app.db.redis import safe_redis
from app.core.redis_scripts import atomic_sliding_window
from app.core.logging_config import get_logger

logger = get_logger("app.rate_limit")


def get_client_ip(request: Request) -> str:
    """Safely extract client IP address without trusting unvalidated proxy headers."""
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


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
