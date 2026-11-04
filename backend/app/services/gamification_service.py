from typing import List

from app.core.logging_config import get_logger
from app.db.client import db
from app.repositories.student_repository import StudentRepository
from app.services.attendance_percentage import ATTENDED_STATUSES, attendance_percentage
from app.services.leaderboard_cache_service import LeaderboardCacheService
from app.services.student_class_ledger import HeldClass, held_classes

logger = get_logger("app.gamification")

# These neither extend a streak nor break it: the class is under review or the student was away with approval.
NEUTRAL_STATUSES = frozenset({"FLAGGED", "EXCUSED"})


def _streaks(classes_newest_first: List[HeldClass], leave_ranges: list, best_so_far: int) -> tuple[int, int]:
    """(current, highest) run of attended classes. Approved leave days are skipped, absences break the run."""

    def on_leave(held: HeldClass) -> bool:
        return any(start <= held.occurrence_date <= end for start, end in leave_ranges)

    def step(held: HeldClass) -> str:
        if held.status in ATTENDED_STATUSES:
            return "attended"
        if held.status in NEUTRAL_STATUSES or on_leave(held):
            return "skip"
        return "break"

    current = 0
    for held in classes_newest_first:
        outcome = step(held)
        if outcome == "break":
            break
        current += outcome == "attended"

    highest, running = best_so_far, 0
    for held in reversed(classes_newest_first):
        outcome = step(held)
        if outcome == "break":
            running = 0
        elif outcome == "attended":
            running += 1
            highest = max(highest, running)
    return current, max(highest, current)


class GamificationService:
    def __init__(self):
        self.student_repo = StudentRepository()
        self.leaderboard_service = LeaderboardCacheService()

    async def update_streak(self, student_id: str, attendance_status: str) -> dict:
        """Helper to compatibility-wrap recalculate_student_streak."""
        return await self.recalculate_student_streak(student_id)

    async def recalculate_student_streak(self, student_id: str) -> dict:
        """Recalculate the streak from the classes held so far."""
        student = await self.student_repo.get_by_id(student_id)
        if not student:
            return {"error": "Student not found"}

        classes = await held_classes(student_id, student.tenantId)
        leaves = await db.leaverequest.find_many(
            where={"studentId": student_id, "tenantId": student.tenantId, "status": "APPROVED"}
        )
        leave_ranges = [(leave.startDate.date(), leave.endDate.date()) for leave in leaves]
        current, highest = _streaks(classes, leave_ranges, student.highestStreak or 0)

        await self.student_repo.update_streak(student_id, current, highest)
        await self.leaderboard_service.update_score(student_id, current, highest)
        return {"current_streak": current, "highest_streak": highest}

    async def get_student_stats(self, student_id: str) -> dict:
        student = await self.student_repo.get_by_id(student_id)
        if not student:
            return {}

        classes = await held_classes(student_id, student.tenantId)
        statuses = [c.status for c in classes if c.status]
        return {
            "current_streak": student.currentStreak or 0,
            "highest_streak": student.highestStreak or 0,
            "total_classes": len(classes),
            "present_count": sum(1 for s in statuses if s in ATTENDED_STATUSES),
            "absent_count": len(classes) - len(statuses) + statuses.count("ABSENT"),
            "flagged_count": statuses.count("FLAGGED"),
            "excused_count": statuses.count("EXCUSED"),
            "attendance_percentage": attendance_percentage(statuses, len(classes)) or 0.0,
        }

    async def get_leaderboard(self, current_student_id: str) -> dict:
        """Fetch the leaderboard from Redis, falling back to DB if empty."""
        return await self.leaderboard_service.get_leaderboard(current_student_id)
