from typing import Dict, Iterable, List

from app.core.logging_config import get_logger
from app.db.client import db
from app.repositories.student_repository import StudentRepository
from app.services.attendance_percentage import ATTENDED_STATUSES, attendance_percentage
from app.services.leaderboard_cache_service import LeaderboardCacheService
from app.services.student_class_ledger import HeldClass, held_classes, held_classes_for

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

    async def recalculate_student_streak(self, student_id: str) -> dict:
        """Recalculate one student's streak from the classes held so far."""
        return (await self.recalculate_streaks([student_id])).get(student_id, {"error": "Student not found"})

    async def recalculate_streaks(self, student_ids: Iterable[str]) -> Dict[str, dict]:
        """Recalculates several students' streaks with a fixed number of queries, however many students there are.
        A streak is only written when it changed."""
        ids = list(dict.fromkeys(student_ids))
        if not ids:
            return {}
        students = await db.student.find_many(where={"id": {"in": ids}})
        tenants = {s.tenantId for s in students}
        classes: Dict[str, list] = {}
        for tenant_id in tenants:
            in_tenant = [s.id for s in students if s.tenantId == tenant_id]
            classes.update(await held_classes_for(in_tenant, tenant_id))
        leaves = await db.leaverequest.find_many(
            where={"studentId": {"in": [s.id for s in students]}, "tenantId": {"in": list(tenants)}, "status": "APPROVED"}
        )
        leave_ranges: Dict[str, list] = {s.id: [] for s in students}
        for leave in leaves:
            leave_ranges[leave.studentId].append((leave.startDate.date(), leave.endDate.date()))

        results: Dict[str, dict] = {}
        changed: Dict[str, tuple] = {}
        scores: Dict[str, tuple] = {}
        for student in students:
            current, highest = _streaks(classes[student.id], leave_ranges[student.id], student.highestStreak or 0)
            if (current, highest) != (student.currentStreak, student.highestStreak):
                changed[student.id] = (current, highest)
            scores[student.id] = (student.tenantId, current, highest)
            results[student.id] = {"current_streak": current, "highest_streak": highest}
        await self.student_repo.update_streaks(changed)
        await self.leaderboard_service.update_scores(scores)
        return results

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
