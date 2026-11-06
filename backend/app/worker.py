"""The background worker: sends the e-mails the API has queued. Run with `arq app.worker.WorkerSettings`."""
from typing import Any, Dict
from zoneinfo import ZoneInfo

from arq import Retry, cron, func
from arq.connections import RedisSettings

from app.core.config import settings
from app.core.logging_config import get_logger
from app.db.client import connect_db, disconnect_db
from app.db.redis import connect_redis, disconnect_redis
from app.services.agent.briefing import send_daily_briefings
from app.services.email_queue import EMAIL_JOB, QUEUED_EMAILS
from app.services.email_service import email_service

logger = get_logger("app.worker")

MAX_TRIES = 4
RETRY_DELAY_SECONDS = 60
JOB_TIMEOUT_SECONDS = 60
BRIEFING_HOUR, BRIEFING_MINUTE = 7, 30  # India time
BRIEFING_TIMEOUT_SECONDS = 300


async def deliver_email(ctx: Dict[str, Any], method: str, arguments: Dict[str, Any]) -> bool:
    """Sends one queued e-mail. A failed delivery is retried with a growing delay, then given up on and logged."""
    if method not in QUEUED_EMAILS:
        raise ValueError(f"{method} is not a queued e-mail")
    if await getattr(email_service, method)(**arguments):
        return True
    attempt = ctx["job_try"]
    if attempt >= MAX_TRIES:
        logger.error("Gave up on the %s e-mail after %d attempts", method, attempt)
        return False
    logger.warning("The %s e-mail was not delivered (attempt %d of %d); retrying", method, attempt, MAX_TRIES)
    raise Retry(defer=attempt * RETRY_DELAY_SECONDS)


async def startup(ctx: Dict[str, Any]) -> None:
    """The briefing reads the database and uses Redis, so the worker connects to both."""
    await connect_db()
    await connect_redis()


async def shutdown(ctx: Dict[str, Any]) -> None:
    await disconnect_redis()
    await disconnect_db()


class WorkerSettings:
    on_startup = startup
    on_shutdown = shutdown
    functions = [func(deliver_email, name=EMAIL_JOB)]
    cron_jobs = [cron(send_daily_briefings, hour=BRIEFING_HOUR, minute=BRIEFING_MINUTE, timeout=BRIEFING_TIMEOUT_SECONDS)]
    timezone = ZoneInfo("Asia/Kolkata")
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    max_tries = MAX_TRIES
    job_timeout = JOB_TIMEOUT_SECONDS
    keep_result = 0
