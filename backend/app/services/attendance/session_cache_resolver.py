import json
from datetime import datetime, timezone
from app.core.logging_config import get_logger
from app.db.redis import safe_redis
from app.repositories.session_repository import SessionRepository
from app.services.attendance.models import CachedSession

logger = get_logger("app.attendance.session_cache")


async def resolve_active_session(session_id: str, session_repo: SessionRepository) -> CachedSession:
    """Fetch active session from Redis cache or database, caching on miss."""
    cache_key = f"session:{session_id}"
    session = None
    r = safe_redis()
    if r:
        try:
            cached = await r.get(cache_key)
            if cached:
                data = json.loads(cached)
                session = CachedSession(
                    id=data["id"],
                    is_active=data["isActive"],
                    academic_class_id=data["academicClassId"],
                    end_time=datetime.fromisoformat(data["endTime"].replace("Z", "+00:00")),
                )
        except Exception:
            logger.warning("Redis session cache read failed.")

    if not session:
        db_session = await session_repo.get_by_id(session_id)
        if not db_session:
            raise ValueError("Attendance session is not active or not found.")
        session = CachedSession(
            id=db_session.id,
            is_active=db_session.isActive,
            academic_class_id=db_session.academicClassId,
            end_time=db_session.endTime,
        )
        now = datetime.now(timezone.utc)
        session_end = session.endTime.replace(tzinfo=timezone.utc) if session.endTime.tzinfo is None else session.endTime
        remaining_seconds = int((session_end - now).total_seconds())
        if session.isActive and remaining_seconds > 0 and r:
            try:
                payload = json.dumps({
                    "id": session.id,
                    "isActive": session.isActive,
                    "academicClassId": session.academicClassId,
                    "endTime": session.endTime.isoformat(),
                })
                await r.setex(cache_key, remaining_seconds, payload)
            except Exception as set_err:
                logger.debug("Failed caching session in Redis: %s", set_err)

    now = datetime.now(timezone.utc)
    session_end = session.endTime.replace(tzinfo=timezone.utc) if session.endTime.tzinfo is None else session.endTime
    if not session.isActive or session_end <= now:
        if session.isActive:
            await session_repo.deactivate(session.id)
            if r:
                try:
                    await r.delete(cache_key)
                except Exception as del_err:
                    logger.debug("Failed deleting session cache key %s: %s", cache_key, del_err)
        raise ValueError("Attendance session is not active or not found.")
    return session
