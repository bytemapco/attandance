import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.core.logging_config import get_logger
from app.core.redis_scripts import atomic_release_lock
from app.db.client import db
from app.db.redis import safe_redis
from app.services.session_service import SessionService

logger = get_logger("app.scheduler")

_SCHEDULER_LOCK_KEY = "lock:session_scheduler"
_SCHEDULER_LOCK_TTL = 25
_POLL_INTERVAL_SECONDS = 30


class SessionScheduler:
    def __init__(self) -> None:
        self.session_service = SessionService()
        self._is_running = False
        self._task: Optional[asyncio.Task] = None

    async def _check_and_close_expired_sessions(self) -> int:
        now = datetime.now(timezone.utc)
        expired_sessions = await db.session.find_many(
            where={
                "isActive": True,
                "endTime": {"lte": now},
            }
        )
        if not expired_sessions:
            return 0

        closed_count = 0
        for session in expired_sessions:
            try:
                logger.info("Automatically closing expired session: %s (ended at %s)", session.id, session.endTime)
                await self.session_service.close_session(session.id)
                closed_count += 1
            except Exception as e:
                logger.error("Failed to auto-close session %s: %s", session.id, e, exc_info=True)

        return closed_count

    async def _loop(self) -> None:
        logger.info("Session lifecycle scheduler background loop started")
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
                    closed = await self._check_and_close_expired_sessions()
                    if closed > 0:
                        logger.info("Scheduler completed cycle: auto-closed %d expired session(s)", closed)

                    if redis_client:
                        try:
                            await atomic_release_lock(redis_client, _SCHEDULER_LOCK_KEY, owner_token)
                        except Exception as rel_err:
                            logger.debug("Scheduler lock release ignored: %s", rel_err)
            except Exception as exc:
                logger.error("Error in session scheduler loop: %s", exc, exc_info=True)

            await asyncio.sleep(_POLL_INTERVAL_SECONDS)

    def start(self) -> None:
        if self._is_running:
            return
        self._is_running = True
        self._task = asyncio.create_task(self._loop())
        logger.info("Session lifecycle scheduler registered")

    def stop(self) -> None:
        if not self._is_running:
            return
        self._is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("Session lifecycle scheduler stopped")


session_scheduler = SessionScheduler()
