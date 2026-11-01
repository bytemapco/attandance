from fastapi import HTTPException, status

from app.core.logging_config import get_logger
from app.db.client import db
from app.repositories.student_repository import StudentRepository
from app.schemas.student import StudentAttendanceItem, StudentAttendanceHistoryResponse
from app.services import student_subjects_service

logger = get_logger("app.student.service")


class StudentService:
    def __init__(self) -> None:
        self.student_repo = StudentRepository()

    async def get_student_by_user_id(self, user_id: str):
        student = await self.student_repo.get_by_user_id(user_id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")
        return student

    async def get_student_attendance_history(self, user_id: str) -> StudentAttendanceHistoryResponse:
        student = await self.get_student_by_user_id(user_id)
        subjects = await student_subjects_service.list_subjects(student)
        conducted = sum(s.conducted for s in subjects)
        attended = sum(s.attended for s in subjects)
        overall_percentage = round(attended * 100 / conducted, 2) if conducted else 0.0

        records = await db.attendancerecord.find_many(
            where={"studentId": student.id, "tenantId": student.tenantId},
            include={"occurrence": {"include": {"courseSection": {"include": {"subject": True}}}}},
            order={"verifiedAt": "desc"},
        )
        return StudentAttendanceHistoryResponse(
            student_id=student.id,
            overall_attendance_percentage=overall_percentage,
            history=[
                StudentAttendanceItem(
                    attendance_id=r.id,
                    class_id=section.id,
                    class_name=section.name,
                    subject=section.subject.name,
                    session_id=r.occurrenceId,
                    status=str(r.status).title(),
                    marked_at=r.verifiedAt,
                    face_score=r.faceScore,
                    liveness_score=r.livenessScore,
                    background_score=None,
                    final_ai_score=None,
                    teacher_note=r.remarks,
                )
                for r in records
                if (section := r.occurrence.courseSection)
            ],
        )
