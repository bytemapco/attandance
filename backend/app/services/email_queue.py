"""Hands e-mails to a Redis-backed queue, so a request never waits for the mail server.

A separate worker process (`app/worker.py`, run by PM2 as `sahaj-worker`) takes the jobs, sends them and retries
the ones that fail. The queue lives in Redis, so a queued e-mail survives an API restart.
"""
from typing import Any, Optional

from arq import create_pool
from arq.connections import ArqRedis, RedisSettings

from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger("app.services.email_queue")

EMAIL_JOB = "deliver_email"
# The only EmailService methods a job may call.
QUEUED_EMAILS = frozenset(
    {"send_invitation_email", "send_device_change_requested_email", "send_device_change_reviewed_email"}
)

_pool: Optional[ArqRedis] = None


async def _queue() -> Optional[ArqRedis]:
    global _pool
    if _pool is None:
        try:
            _pool = await create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
        except Exception:
            logger.exception("The e-mail queue is unreachable")
    return _pool


async def enqueue_email(method: str, **arguments: Any) -> bool:
    """Queues one e-mail. Returns False when it could not be queued, so the caller can say so; the request itself
    never fails because of e-mail."""
    if method not in QUEUED_EMAILS:
        raise ValueError(f"{method} is not a queued e-mail")
    queue = await _queue()
    if queue is None:
        return False
    try:
        return await queue.enqueue_job(EMAIL_JOB, method, arguments) is not None
    except Exception:
        logger.exception("Could not queue the %s e-mail", method)
        return False


async def close_queue() -> None:
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None
