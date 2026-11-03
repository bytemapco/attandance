"""Locks an account after repeated wrong passwords, using a counter in Redis."""
from typing import Optional

from fastapi import HTTPException, status
from redis.asyncio import Redis

from app.core.logging_config import get_logger
from app.core.redis_scripts import atomic_incr_expire

logger = get_logger("app.services.login_lockout")

FAILED_LOGIN_PREFIX = "failed_login:"
MAX_FAILED_LOGINS = 5
FAILED_LOGIN_WINDOW_SECONDS = 900


async def reject_if_locked(redis: Optional[Redis], login_key: str) -> None:
    if not redis:
        return
    try:
        failed_attempts = await redis.get(login_key)
    except Exception as exc:
        logger.warning("Redis failed login check error: %s", exc)
        return
    if failed_attempts and int(failed_attempts) >= MAX_FAILED_LOGINS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.",
        )


async def count_failure(redis: Optional[Redis], login_key: str) -> None:
    if not redis:
        return
    try:
        await atomic_incr_expire(redis, login_key, FAILED_LOGIN_WINDOW_SECONDS)
    except Exception as exc:
        logger.warning("Redis increment failed login error: %s", exc)


async def clear_failures(redis: Optional[Redis], login_key: str) -> None:
    if not redis:
        return
    try:
        await redis.delete(login_key)
    except Exception as exc:
        logger.warning("Redis could not clear the failed login count: %s", exc)
