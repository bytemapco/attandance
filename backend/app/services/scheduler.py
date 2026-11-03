import asyncio
import uuid
from typing import Optional

from app.core.logging_config import get_logger
from app.core.redis_scripts import atomic_release_lock
from app.db.redis import safe_redis
from app.services.occurrence_closer import close_occurrence, expired_unclosed

logger = get_logger("app.scheduler")

_SCHEDULER_LOCK_KEY = "lock:session_scheduler"
_SCHEDULER_LOCK_TTL = 25
_POLL_INTERVAL_SECONDS = 30


class SessionScheduler:
    def __init__(self) -> None:
        self._is_running = False
        self._task: Optional[asyncio.Task] = None

    async def _close_expired_windows(self) -> int:
        """Closes classes whose verification window ended and that the teacher never closed."""
        closed_count = 0
        for occurrence in await expired_unclosed():
            try:
                logger.info("Automatically closing class %s (window ended at %s)", occurrence.id, occurrence.verificationExpires)
                await close_occurrence(occurrence.tenantId, occurrence, occurrence.faculty.userId, auto=True)
                closed_count += 1
            except Exception as e:
                logger.error("Failed to auto-close class %s: %s", occurrence.id, e, exc_info=True)
        return closed_count

    async def _loop(self) -> None:
        logger.info("Class window scheduler background loop started")
        while self._is_running:
            owner_token = str(uuid.uuid4())
            redis_client = safe_redis()
            acquired_lock = False

            try:
                if redis_client:
                    acquired_lock = bool(
                        await redis_client.set(_SCHEDULER_LOCK_KEY, owner_token, nx=True, ex=_SCHEDULER_LOCK_TTL)
                    )
                else:
                    # Single-node / degraded fallback
                    acquired_lock = True

                if acquired_lock:
                    closed = await self._close_expired_windows()
                    if closed > 0:
                        logger.info("Scheduler completed cycle: auto-closed %d class(es)", closed)

                    if redis_client:
                        try:
                            await atomic_release_lock(redis_client, _SCHEDULER_LOCK_KEY, owner_token)
                        except Exception as rel_err:
                            logger.debug("Scheduler lock release ignored: %s", rel_err)
            except Exception as exc:
                logger.error("Error in class window scheduler loop: %s", exc, exc_info=True)

            await asyncio.sleep(_POLL_INTERVAL_SECONDS)

    def start(self) -> None:
        if self._is_running:
            return
        self._is_running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Class window scheduler registered")

    def stop(self) -> None:
        if not self._is_running:
            return
        self._is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("Class window scheduler stopped")


session_scheduler = SessionScheduler()
