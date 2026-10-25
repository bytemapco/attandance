import time
from typing import Callable
from fastapi import HTTPException, Request, status
from app.db.redis import get_redis
from app.core.logging_config import get_logger

logger = get_logger("app.rate_limit")


def rate_limiter(requests_limit: int = 60, window_seconds: int = 60) -> Callable:
    """
    Sliding window rate limiter using Redis sorted sets.
    Keyed by IP address and request route path.
    """

    async def dependency(request: Request) -> None:
        try:
            redis = get_redis()
        except Exception:
            # If redis is temporarily unavailable, permit request
            return

        client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or (
            request.client.host if request.client else "unknown"
        )
        route_key = f"rate_limit:{client_ip}:{request.url.path}"
        current_time = time.time()
        window_start = current_time - window_seconds

        try:
            pipe = redis.pipeline()
            # Remove old entries outside the window
            pipe.zremrangebyscore(route_key, 0, window_start)
            # Count remaining
            pipe.zcard(route_key)
            # Add current timestamp
            pipe.zadd(route_key, {str(current_time): current_time})
            # Set TTL on the key
            pipe.expire(route_key, window_seconds + 5)
            results = await pipe.execute()

            current_count = results[1]
            if current_count >= requests_limit:
                logger.warning("Rate limit exceeded for %s on %s", client_ip, request.url.path)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please wait before retrying.",
                    headers={"Retry-After": str(window_seconds)},
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.debug("Redis rate limiter check error: %s", e)
            return

    return dependency
