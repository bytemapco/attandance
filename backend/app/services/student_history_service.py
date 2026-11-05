from datetime import date
from typing import Optional
from fastapi import HTTPException, status as http_status
from prisma.models import Student

from app.db.client import db
from app.schemas.student_history import StudentHistoryResponse
from app.services.student_history import build_where, to_item


async def get_history(
    student: Student,
    start: Optional[date],
    end: Optional[date],
    course_section_id: Optional[str],
    status: Optional[str],
    limit: int,
    offset: int,
) -> StudentHistoryResponse:
    if start and end and end < start:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="The end date is before the start date.")
    enrollments = await db.courseenrollment.find_many(
        where={
            "studentId": student.id,
            "endedAt": None,
            "status": "ACTIVE",
            "courseSection": {"is": {"tenantId": student.tenantId}},
        }
    )
    since = {e.courseSectionId: e.enrolledAt.date() for e in enrollments}
    where = build_where(student.tenantId, student.id, since, start, end, course_section_id, status)
    total = await db.classoccurrence.count(where=where)
    rows = await db.classoccurrence.find_many(
        where=where,
        include={
            "courseSection": {"include": {"subject": True}},
            "attendanceRecords": {"where": {"studentId": student.id}},
        },
        order=[{"date": "desc"}, {"startTime": "desc"}],
        skip=offset,
        take=limit,
    )
    return StudentHistoryResponse(
        items=[to_item(row) for row in rows],
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + len(rows) < total,
    )
