from typing import Tuple
from app.core.logging_config import get_logger
from app.db.client import db
from app.db.redis import safe_redis
from app.repositories.student_repository import StudentRepository
from app.services.attendance_percentage import ATTENDED_STATUSES

logger = get_logger("app.gamification.leaderboard")

ATTENDED_FILTER = {"status": {"in": sorted(ATTENDED_STATUSES)}}


def _points(attended_count: int, highest_streak: int, current_streak: int) -> int:
    return attended_count * 50 + highest_streak * 100 + current_streak * 20


class LeaderboardCacheService:
    def __init__(self):
        self.student_repo = StudentRepository()

    async def update_score(self, student_id: str, current_streak: int, highest_streak: int) -> None:
        """Update a student's score in the Redis leaderboard."""
        try:
            student = await self.student_repo.get_by_id(student_id)
            tenant_id = getattr(student, "tenantId", None) if student else None
            cache_key = f"leaderboard:{tenant_id or 'global'}:points"

            redis = safe_redis()
            if not redis:
                return

            attended = await db.attendancerecord.count(where={"studentId": student_id, **ATTENDED_FILTER})
            await redis.zadd(cache_key, {student_id: float(_points(attended, highest_streak, current_streak))})
        except Exception as e:
            logger.warning("Failed to update leaderboard cache: %s", e)

    async def get_leaderboard(self, current_student_id: str) -> dict:
        """Fetch the leaderboard from Redis, falling back to DB if empty."""
        student = await self.student_repo.get_by_id(current_student_id)
        tenant_id = getattr(student, "tenantId", None) if student else None
        cache_key = f"leaderboard:{tenant_id or 'global'}:points"
        redis = safe_redis()

        try:
            if redis and not await redis.exists(cache_key):
                lock_key = f"lock:{cache_key}:rebuild"
                acquired = await redis.set(lock_key, "1", nx=True, ex=15)
                if acquired:
                    try:
                        await self._rebuild_leaderboard_cache(redis, cache_key, tenant_id=tenant_id)
                    finally:
                        await redis.delete(lock_key)
        except Exception as e:
            logger.warning("Redis operation failed in leaderboard check: %s", e)

        leaderboard_data = []
        if redis:
            leaderboard_data = await self._fetch_leaderboard_from_cache(redis, cache_key)

        if not leaderboard_data:
            return await self._get_leaderboard_from_db(current_student_id, tenant_id=tenant_id)

        user_rank, user_points = await self._fetch_user_rank_and_points(redis, cache_key, current_student_id)
        return {"leaderboard": leaderboard_data, "user_rank": user_rank, "user_points": user_points}

    async def _rebuild_leaderboard_cache(self, redis, cache_key: str, tenant_id: str | None = None) -> None:
        """Rebuild the leaderboard cache from DB data."""
        if not redis:
            return
        try:
            where_cond: dict = {"user": {"is": {"isActive": True}}}
            if tenant_id:
                where_cond["tenantId"] = tenant_id

            students = await db.student.find_many(
                where=where_cond, include={"attendanceRecords": {"where": ATTENDED_FILTER}}
            )
            scores_dict = {
                s.id: float(_points(len(s.attendanceRecords), s.highestStreak or 0, s.currentStreak or 0))
                for s in students
            }
            if scores_dict:
                await redis.zadd(cache_key, scores_dict)
                await redis.expire(cache_key, 3600)
        except Exception as e:
            logger.error("Failed to rebuild leaderboard cache: %s", e, exc_info=True)

    async def _fetch_leaderboard_from_cache(self, redis, cache_key: str) -> list:
        """Fetch top 10 students from Redis cache and load details from DB."""
        try:
            top_members = await redis.zrevrange(cache_key, 0, 9, withscores=True)
            if not top_members:
                return []
            top_ids = [m[0] for m in top_members]
            top_students = await db.student.find_many(where={"id": {"in": top_ids}})
            students_map = {s.id: s for s in top_students}

            leaderboard_data = []
            for s_id, score in top_members:
                s = students_map.get(s_id)
                if s:
                    name = f"{s.firstName or ''} {s.lastName or ''}".strip() or "Student"
                    leaderboard_data.append(
                        {
                            "student_id": s_id,
                            "name": name,
                            "points": int(score),
                            "current_streak": s.currentStreak or 0,
                        }
                    )
            return leaderboard_data
        except Exception as e:
            logger.error("Failed to fetch leaderboard from cache: %s", e, exc_info=True)
            return []

    async def _fetch_user_rank_and_points(self, redis, cache_key: str, student_id: str) -> Tuple[int | None, int]:
        """Fetch rank and points for a specific user from Redis."""
        if not redis:
            return None, 0
        try:
            current_rank_0 = await redis.zrevrank(cache_key, student_id)
            user_rank = current_rank_0 + 1 if current_rank_0 is not None else None
            current_score = await redis.zscore(cache_key, student_id)
            user_points = int(current_score) if current_score is not None else 0
            return user_rank, user_points
        except Exception as e:
            logger.warning("Failed to fetch user rank from Redis: %s", e)
            return None, 0

    async def _get_leaderboard_from_db(self, current_student_id: str, tenant_id: str | None = None) -> dict:
        """Generate leaderboard directly from database query (fallback)."""
        try:
            where_cond: dict = {"user": {"is": {"isActive": True}}}
            if tenant_id:
                where_cond["tenantId"] = tenant_id

            students = await db.student.find_many(
                where=where_cond, include={"attendanceRecords": {"where": ATTENDED_FILTER}}
            )
            student_list = [
                (s, _points(len(s.attendanceRecords), s.highestStreak or 0, s.currentStreak or 0)) for s in students
            ]

            student_list.sort(key=lambda x: x[1], reverse=True)

            leaderboard_data = []
            for s, points in student_list[:10]:
                name = f"{s.firstName or ''} {s.lastName or ''}".strip() or "Student"
                leaderboard_data.append(
                    {
                        "student_id": s.id,
                        "name": name,
                        "points": points,
                        "current_streak": s.currentStreak or 0,
                    }
                )

            user_rank = None
            user_points = 0
            for index, (s, points) in enumerate(student_list):
                if s.id == current_student_id:
                    user_rank = index + 1
                    user_points = points
                    break
            return {"leaderboard": leaderboard_data, "user_rank": user_rank, "user_points": user_points}
        except Exception as e:
            logger.error("Database fallback leaderboard query failed: %s", e, exc_info=True)
            return {"leaderboard": [], "user_rank": None, "user_points": 0}
