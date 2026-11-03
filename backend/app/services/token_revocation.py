"""The Redis deny-list of signed-out or already-used tokens."""
from dataclasses import dataclass

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.logging_config import get_logger
from app.db.redis import safe_redis

logger = get_logger("app.token_revocation")

DENYLIST_PREFIX = "denylist:"
REFRESH_TOKEN_TTL_SECONDS = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400


@dataclass(frozen=True)
class RevocationMessages:
    revoked: str
    unavailable: str


ACCESS_TOKEN = RevocationMessages(
    revoked="Token has been revoked",
    unavailable="Authentication service temporarily unavailable due to revocation cache outage.",
)
REFRESH_TOKEN = RevocationMessages(
    revoked="Refresh token has been revoked",
    unavailable="Authentication service temporarily unavailable.",
)


def _unavailable(messages: RevocationMessages) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=messages.unavailable,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def ensure_not_revoked(token: str, messages: RevocationMessages) -> None:
    """Raises 401 for a revoked token. When Redis cannot be reached the token passes, unless the deployment fails closed."""
    redis = safe_redis()
    if not redis:
        if settings.TOKEN_REVOCATION_FAIL_CLOSED:
            raise _unavailable(messages)
        return
    try:
        revoked = await redis.get(f"{DENYLIST_PREFIX}{token}")
    except Exception as exc:
        logger.critical("Security alert: could not check the token deny-list in Redis: %s", exc)
        if settings.TOKEN_REVOCATION_FAIL_CLOSED:
            raise _unavailable(messages) from exc
        return
    if revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=messages.revoked, headers={"WWW-Authenticate": "Bearer"}
        )


async def revoke(token: str, ttl_seconds: int) -> None:
    """Denies a token until it would have expired anyway. Without Redis there is nothing to record."""
    redis = safe_redis()
    if not redis:
        return
    try:
        await redis.setex(f"{DENYLIST_PREFIX}{token}", ttl_seconds, "revoked")
    except Exception as exc:
        logger.warning("Could not add a token to the Redis deny-list: %s", exc)
