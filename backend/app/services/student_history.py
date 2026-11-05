"""What a student's attendance history shows, as plain functions the service feeds with database rows."""
from datetime import date, datetime, time
from typing import Dict, List, Optional

from app.schemas.student_history import HistoryItem


def _midnight(day: date) -> datetime:
    return datetime.combine(day, time.min)


def effective_status(record) -> str:
    """A class that was held and closed with no record for the student counts as an absence."""
    return str(record.status) if record else "ABSENT"


def _status_clause(student_id: str, status: str) -> dict:
    if status == "ABSENT":
        has_other_mark = {"attendanceRecords": {"some": {"studentId": student_id, "status": {"not": "ABSENT"}}}}
        return {"isAttendanceLocked": True, "status": "CONDUCTED", "NOT": [has_other_mark]}
    return {"attendanceRecords": {"some": {"studentId": student_id, "status": status}}}


def _sections(since: Dict[str, date], course_section_id: Optional[str]) -> Dict[str, date]:
    """All the student's sections, or just the one asked for. A section they are not in matches nothing."""
    if course_section_id is None:
        return since
    return {course_section_id: since[course_section_id]} if course_section_id in since else {}


def build_where(
    tenant_id: str,
    student_id: str,
    since: Dict[str, date],
    start: Optional[date] = None,
    end: Optional[date] = None,
    course_section_id: Optional[str] = None,
    status: Optional[str] = None,
) -> dict:
    """Classes the student has an outcome for: held and closed, or marked by them. Cancelled classes never show.

    `since` maps each active section to the day the student joined it; earlier classes are not theirs.
    """
    sections = _sections(since, course_section_id)
    clauses: List[dict] = [
        {"OR": [{"courseSectionId": sid, "date": {"gte": _midnight(joined)}} for sid, joined in sections.items()]},
        {
            "OR": [
                {"isAttendanceLocked": True, "status": "CONDUCTED"},
                {"attendanceRecords": {"some": {"studentId": student_id, "status": {"not": "ABSENT"}}}},
            ]
        },
    ]
    if status:
        clauses.append(_status_clause(student_id, status))
    where: dict = {"tenantId": tenant_id, "status": {"not": "CANCELLED"}, "AND": clauses}
    if start or end:
        where["date"] = {**({"gte": _midnight(start)} if start else {}), **({"lte": _midnight(end)} if end else {})}
    return where


def to_item(occurrence) -> HistoryItem:
    """`occurrence` carries courseSection.subject and only this student's attendanceRecords."""
    record = occurrence.attendanceRecords[0] if occurrence.attendanceRecords else None
    section = occurrence.courseSection
    status = effective_status(record)
    return HistoryItem(
        occurrence_id=occurrence.id,
        attendance_id=record.id if record else None,
        course_section_id=section.id,
        subject_name=section.subject.name,
        subject_code=section.subject.code,
        class_code=section.name,
        date=occurrence.date.date(),
        start_time=occurrence.startTime,
        end_time=occurrence.endTime,
        status=status,
        method=str(record.method) if record else None,
        marked_at=record.verifiedAt if record else None,
        face_score=record.faceScore if record else None,
        liveness_score=record.livenessScore if record else None,
        remarks=record.remarks if record else None,
        student_note=record.studentNote if record else None,
        can_add_note=bool(record and status == "FLAGGED"),
    )
