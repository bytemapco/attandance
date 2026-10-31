from typing import List, Optional
from fastapi import HTTPException, status

from app.db.client import db
from app.schemas.teacher import (
    StudentClassHistoryResponse,
    StudentClassSessionLog,
)


class TeacherHistoryService:
    @staticmethod
    def _resolve_full_name(first: Optional[str], last: Optional[str]) -> str:
        return f"{first or ''} {last or ''}".strip() or "—"

    @classmethod
    async def get_student_class_attendance_history(
        cls, teacher_id: str, class_id: str, student_id: str
    ) -> StudentClassHistoryResponse:
        academic_class = await db.academicclass.find_unique(where={"id": class_id}, include={"subject": True})
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

        enrollment = await db.enrollment.find_first(
            where={"studentId": student_id, "academicClassId": class_id},
            include={"student": {"include": {"user": True}}},
        )
        if not enrollment or not enrollment.student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not enrolled in this class.")

        student = enrollment.student
        full_name = cls._resolve_full_name(student.firstName, student.lastName)
        sessions = await db.session.find_many(where={"academicClassId": class_id}, order={"startTime": "desc"})
        total_sessions = len(sessions)
        session_ids = [s.id for s in sessions]

        records = await db.attendance.find_many(where={"studentId": student_id, "sessionId": {"in": session_ids}}) if session_ids else []
        records_by_session = {r.sessionId: r for r in records}
        session_logs: List[StudentClassSessionLog] = []
        attended_count = 0

        for idx, s in enumerate(sessions):
            rec = records_by_session.get(s.id)
            current_status = rec.status if rec else "Absent"
            if current_status in ["Present", "Approved"]:
                attended_count += 1
            session_logs.append(
                StudentClassSessionLog(
                    session_id=s.id,
                    session_name=f"Session {len(sessions) - idx}",
                    session_date=s.startTime.strftime("%Y-%m-%d") if s.startTime else "N/A",
                    start_time=s.startTime,
                    end_time=s.endTime,
                    status=current_status,
                    final_ai_score=rec.finalAiScore if rec else 0.0,
                    marked_at=rec.createdAt if rec else None,
                    remarks=rec.remarks if rec else None,
                    student_note=rec.studentNote if rec else None,
                )
            )

        attendance_pct = round((attended_count / total_sessions * 100.0), 2) if total_sessions > 0 else 0.0
        return StudentClassHistoryResponse(
            student_id=student.id,
            student_name=full_name,
            enrollment_number=student.enrollmentNumber,
            email=student.user.email if student.user else "",
            class_id=class_id,
            class_name=academic_class.name,
            subject=academic_class.subject.name if academic_class.subject else "—",
            total_sessions=total_sessions,
            attended_sessions=attended_count,
            attendance_percentage=attendance_pct,
            at_risk=(total_sessions > 0 and attendance_pct < 75.0),
            sessions=session_logs,
        )
