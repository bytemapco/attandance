"""Limits on how often a person may chat and how many model tokens an institution may use in a day."""
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.logging_config import get_logger
from app.core.redis_scripts import atomic_incr_expire
from app.db.redis import safe_redis
from app.services.agent.types import Principal

logger = get_logger("app.agent.budget")
MINUTE = 60
TWO_DAYS = 2 * 24 * 3600


def _too_many(detail: str, retry_after: int) -> HTTPException:
    return HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, detail=detail, headers={"Retry-After": str(retry_after)})


def _token_key(tenant_id: str) -> str:
    return f"agent:tokens:{tenant_id}:{datetime.now(timezone.utc):%Y%m%d}"


async def limit_messages(principal: Principal) -> None:
    redis = safe_redis()
    if not redis:
        return
    key = f"agent:messages:{principal.user_id}"
    if await atomic_incr_expire(redis, key, MINUTE) > settings.AGENT_MESSAGES_PER_MINUTE:
        raise _too_many("You are sending messages too fast. Wait a moment.", MINUTE)


async def require_budget(principal: Principal) -> None:
    redis = safe_redis()
    if not redis:
        logger.warning("Redis is down, so the assistant's daily token budget is not enforced")
        return
    used = int(await redis.get(_token_key(principal.tenant_id)) or 0)
    if used >= settings.AGENT_DAILY_TOKEN_BUDGET:
        raise _too_many("Your institution has used today's assistant allowance. It resets at midnight UTC.", 3600)


async def record_tokens(principal: Principal, tokens: int) -> None:
    redis = safe_redis()
    if not redis or tokens <= 0:
        return
    key = _token_key(principal.tenant_id)
    await redis.incrby(key, tokens)
    await redis.expire(key, TWO_DAYS)
