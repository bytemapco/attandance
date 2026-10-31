from typing import List, Optional
from fastapi import HTTPException, status
from app.core.logging_config import get_logger
from app.db.client import db
from app.schemas.teacher import (
    AbsentStudentItem,
    BulkMarkRequest,
    SessionAttendanceResponse,
    SessionStudentAttendanceItem,
)
from app.services.gamification_service import GamificationService
from app.services.teacher.teacher_session_service import TeacherSessionService

logger = get_logger("app.teacher.attendance_roll")


class TeacherAttendanceRollService:
    @staticmethod
    def _resolve_full_name(first: Optional[str], last: Optional[str]) -> str:
        return f"{first or ''} {last or ''}".strip() or "—"

    @classmethod
    async def get_session_attendance_roll(cls, teacher_id: str, session_id: str) -> SessionAttendanceResponse:
        session = await TeacherSessionService.get_session_with_auth(session_id, teacher_id)

        enrollments = await db.enrollment.find_many(
            where={"academicClassId": session.academicClassId},
            include={"student": {"include": {"user": True}}},
        )
        attendance_map = {r.studentId: r for r in await db.attendance.find_many(where={"sessionId": session_id})}

        student_attendance_items = []
        for e in enrollments:
            s = e.student
            if not s:
                continue
            rec = attendance_map.get(s.id)
            student_attendance_items.append(
                SessionStudentAttendanceItem(
                    student_id=s.id,
                    enrollment_number=s.enrollmentNumber,
                    full_name=cls._resolve_full_name(s.firstName, s.lastName),
                    email=s.user.email if s.user else "",
                    status=rec.status if rec else "Absent",
                    final_score=rec.finalAiScore if rec else 0.0,
                    marked_at=rec.createdAt if rec else None,
                )
            )
        return SessionAttendanceResponse(
            session_id=session_id,
            class_name=session.academicClass.name,
            roster=student_attendance_items,
        )

    # Alias for backward compatibility
    get_session_attendance_roster = get_session_attendance_roll

    @classmethod
    async def get_absent_students(cls, teacher_id: str, session_id: str) -> List[AbsentStudentItem]:
        session = await TeacherSessionService.get_session_with_auth(session_id, teacher_id)

        marked_ids = {r.studentId for r in await db.attendance.find_many(where={"sessionId": session_id})}
        enrollments = await db.enrollment.find_many(
            where={"academicClassId": session.academicClassId},
            include={"student": {"include": {"user": True}}},
        )
        return [
            AbsentStudentItem(
                student_id=s.id,
                enrollment_number=s.enrollmentNumber,
                full_name=cls._resolve_full_name(s.firstName, s.lastName),
                email=s.user.email if s.user else "",
            )
            for e in enrollments
            if (s := e.student) and s.id not in marked_ids
        ]

    @classmethod
    async def bulk_mark_attendance(cls, teacher_id: str, session_id: str, request: BulkMarkRequest) -> int:
        await TeacherSessionService.get_session_with_auth(session_id, teacher_id)

        count = 0
        gamification_service = GamificationService()
        for record in request.records:
            await db.attendance.upsert(
                where={"studentId_sessionId": {"studentId": record.student_id, "sessionId": session_id}},
                data={
                    "create": {
                        "studentId": record.student_id,
                        "sessionId": session_id,
                        "status": record.status,
                        "faceScore": 0.0,
                        "livenessScore": 0.0,
                        "backgroundScore": 0.0,
                        "finalAiScore": 0.0,
                        "gpsLatitude": 0.0,
                        "gpsLongitude": 0.0,
                        "remarks": "Manual entry by teacher",
                    },
                    "update": {"status": record.status, "remarks": "Manual entry by teacher"},
                },
            )
            count += 1
            try:
                await gamification_service.recalculate_student_streak(record.student_id)
            except Exception as e:
                logger.warning("Failed to recalculate streak for student %s in bulk mark: %s", record.student_id, e)
        return count

    @classmethod
    async def manual_override_attendance(cls, teacher_id: str, session_id: str, student_id: str, status_val: str) -> bool:
        session = await TeacherSessionService.get_session_with_auth(session_id, teacher_id)

        enrollment = await db.enrollment.find_unique(
            where={"studentId_academicClassId": {"studentId": student_id, "academicClassId": session.academicClassId}}
        )
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not enrolled in this class.")

        existing = await db.attendance.find_unique(
            where={"studentId_sessionId": {"studentId": student_id, "sessionId": session_id}}
        )
        if existing:
            await db.attendance.update(
                where={"id": existing.id},
                data={"status": status_val, "remarks": f"Manual override by Teacher to {status_val}"},
            )
        else:
            score = 1.0 if status_val == "Present" else 0.0
            await db.attendance.create(
                data={
                    "studentId": student_id,
                    "sessionId": session_id,
                    "status": status_val,
                    "faceScore": score,
                    "livenessScore": score,
                    "backgroundScore": score,
                    "finalAiScore": score,
                    "gpsLatitude": 0.0,
                    "gpsLongitude": 0.0,
                    "remarks": f"Manual override by Teacher to {status_val}",
                }
            )

        try:
            await GamificationService().recalculate_student_streak(student_id)
        except Exception as e:
            logger.warning("Failed to recalculate streak for student %s in manual override: %s", student_id, e)

        return True


# Backward-compatible alias
TeacherRosterService = TeacherAttendanceRollService
