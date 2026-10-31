from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status

from app.db.client import db
from app.repositories.class_repository import ClassRepository


class TeacherExportService:
    @classmethod
    async def export_class_attendance(
        cls, class_id: str, teacher_id: str, from_date: Optional[datetime], to_date: Optional[datetime]
    ) -> List[dict]:
        academic_class = await ClassRepository().get_by_id(class_id)
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You do not teach this academic class."
            )

        session_where: dict = {"academicClassId": class_id}
        if from_date or to_date:
            time_filter = {}
            if from_date:
                time_filter["gte"] = from_date
            if to_date:
                time_filter["lte"] = to_date
            session_where["startTime"] = time_filter

        rows = []
        sessions = await db.session.find_many(
            where=session_where,
            include={"academicClass": {"include": {"subject": True}}},
            order={"startTime": "asc"},
        )
        for s in sessions:
            records = await db.attendance.find_many(
                where={"sessionId": s.id},
                include={"student": {"include": {"user": True}}},
            )
            for rec in records:
                stu = rec.student
                rows.append({
                    "enrollment_number": stu.enrollmentNumber if stu else "",
                    "first_name": stu.firstName or "" if stu else "",
                    "last_name": stu.lastName or "" if stu else "",
                    "email": stu.user.email if stu and stu.user else "",
                    "session_date": s.startTime.isoformat(),
                    "class_name": s.academicClass.name if s.academicClass else "—",
                    "subject": s.academicClass.subject.name if s.academicClass and s.academicClass.subject else "—",
                    "status": rec.status,
                    "final_ai_score": rec.finalAiScore,
                    "remarks": rec.remarks or "",
                })
        return rows
