"""Finding a class on a day, and refusing it unless it is the teacher's own."""
from typing import Any, Optional

from fastapi import HTTPException, status

from app.db.client import db
from app.services.agent.types import Principal

WITH_SUBJECT = {"courseSection": {"include": {"subject": True}}}


async def my_occurrence(principal: Principal, occurrence_id: str, include: Optional[dict[str, Any]] = None):
    occurrence = await db.classoccurrence.find_first(
        where={"id": occurrence_id, "tenantId": principal.tenant_id}, include=include or WITH_SUBJECT
    )
    if not occurrence:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Class not found.")
    if principal.teacher.id not in (occurrence.facultyId, occurrence.substituteFacultyId):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You are not assigned to this class.")
    return occurrence


def describe(occurrence) -> str:
    section = occurrence.courseSection
    return f"{section.name} {section.subject.name} {occurrence.startTime}-{occurrence.endTime} on {occurrence.date.date().isoformat()}"


def bad_request(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_400_BAD_REQUEST, detail)
