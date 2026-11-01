from datetime import datetime, timezone

from app.core.logging_config import get_logger
from app.repositories.student_repository import StudentRepository
from app.repositories.attendance_repository import AttendanceRepository
from app.services.leaderboard_cache_service import LeaderboardCacheService

logger = get_logger("app.gamification")


class GamificationService:
    def __init__(self):
        self.student_repo = StudentRepository()
        self.attendance_repo = AttendanceRepository()
        self.leaderboard_service = LeaderboardCacheService()

    async def update_streak(self, student_id: str, attendance_status: str) -> dict:
        """Helper to compatibility-wrap recalculate_student_streak."""
        return await self.recalculate_student_streak(student_id)

    async def recalculate_student_streak(self, student_id: str) -> dict:
        """Recalculate student streak based on historical attendance logs and active sessions."""
        student = await self.student_repo.get_by_id(student_id)
        if not student:
            return {"error": "Student not found"}

        from app.db.client import db

        enrollments = await db.enrollment.find_many(where={"studentId": student_id})
        class_ids = [e.academicClassId for e in enrollments]

        if not class_ids:
            await self.student_repo.update_streak(student_id, 0, student.highestStreak or 0)
            await self._update_redis_score(student_id, 0, student.highestStreak or 0)
            return {"current_streak": 0, "highest_streak": student.highestStreak or 0}

        now = datetime.now(timezone.utc)

        # Get all sessions that have already started
        sessions = await db.session.find_many(
            where={"academicClassId": {"in": class_ids}, "startTime": {"lte": now}}, order={"startTime": "desc"}
        )

        attendance = await db.attendance.find_many(where={"studentId": student_id})
        attendance_map = {a.sessionId: a for a in attendance}

        leaves = await db.leaverequest.find_many(where={"studentId": student_id, "status": "APPROVED"})

        def is_on_leave(session_start: datetime) -> bool:
            s_start = session_start.replace(tzinfo=timezone.utc) if session_start.tzinfo is None else session_start
            for leave in leaves:
                l_start = (
                    leave.startDate.replace(tzinfo=timezone.utc) if leave.startDate.tzinfo is None else leave.startDate
                )
                l_end = leave.endDate.replace(tzinfo=timezone.utc) if leave.endDate.tzinfo is None else leave.endDate
                if l_start <= s_start <= l_end:
                    return True
            return False

        # Filter out active sessions where student hasn't checked in yet
        valid_sessions = []
        for s in sessions:
            s_end = s.endTime.replace(tzinfo=timezone.utc) if s.endTime.tzinfo is None else s.endTime
            is_active = s.isActive and s_end > now
            has_checked_in = s.id in attendance_map and attendance_map[s.id].status in ("Present", "Approved")

            if is_active and not has_checked_in:
                continue
            valid_sessions.append(s)

        # 1. Current streak calculation (descending order)
        current_streak = 0
        for s in valid_sessions:
            att = attendance_map.get(s.id)
            status = att.status if att else None

            if status in ("Present", "Approved"):
                current_streak += 1
            elif is_on_leave(s.startTime):
                continue
            elif status == "Flagged":
                continue
            else:
                break

        # 2. Highest streak calculation (ascending order)
        highest_streak = student.highestStreak or 0
        running_streak = 0
        for s in reversed(valid_sessions):
            att = attendance_map.get(s.id)
            status = att.status if att else None

            if status in ("Present", "Approved"):
                running_streak += 1
                highest_streak = max(highest_streak, running_streak)
            elif is_on_leave(s.startTime):
                continue
            elif status == "Flagged":
                continue
            else:
                running_streak = 0

        highest_streak = max(highest_streak, current_streak)

        await self.student_repo.update_streak(student_id, current_streak, highest_streak)
        await self._update_redis_score(student_id, current_streak, highest_streak)
        return {"current_streak": current_streak, "highest_streak": highest_streak}

    async def get_student_stats(self, student_id: str) -> dict:
        student = await self.student_repo.get_by_id(student_id)
        if not student:
            return {}

        all_records = await self.attendance_repo.get_by_student_id(student_id)
        total = len(all_records)
        present = sum(1 for r in all_records if r.status in ("Present", "Approved"))
        absent = sum(1 for r in all_records if r.status == "Absent")
        flagged = sum(1 for r in all_records if r.status == "Flagged")
        excused = sum(1 for r in all_records if r.status == "Excused")

        return {
            "current_streak": student.currentStreak or 0,
            "highest_streak": student.highestStreak or 0,
            "total_classes": total,
            "present_count": present,
            "absent_count": absent,
            "flagged_count": flagged,
            "excused_count": excused,
            "attendance_percentage": round((present / total * 100) if total > 0 else 0, 2),
        }

    async def _update_redis_score(self, student_id: str, current_streak: int, highest_streak: int) -> None:
        """Update a student's score in the Redis leaderboard."""
        await self.leaderboard_service.update_score(student_id, current_streak, highest_streak)

    async def get_leaderboard(self, current_student_id: str) -> dict:
        """Fetch the leaderboard from Redis, falling back to DB if empty."""
        return await self.leaderboard_service.get_leaderboard(current_student_id)
