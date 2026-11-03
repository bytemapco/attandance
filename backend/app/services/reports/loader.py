"""Reads the closed classes, students and marks a report needs. Always scoped to one institution."""
from datetime import date, datetime, time
from typing import Optional

from app.db.client import db
from app.schemas.reports import ReportClass, ReportFilters, ReportSubject
from app.services.reports.types import Learner, Lecture, SectionData
from app.services.system_config_service import SystemConfigService


def _scope(tenant_id: str, teacher_id: Optional[str], group_id: Optional[str], section_id: Optional[str]) -> dict:
    where: dict = {"tenantId": tenant_id}
    if teacher_id:
        where["faculties"] = {"some": {"teacherId": teacher_id}}
    if group_id:
        where["groupId"] = group_id
    if section_id:
        where["id"] = section_id
    return where


def _held_classes(date_from: Optional[date], date_to: date) -> dict:
    """Conducted classes whose register is closed; cancelled and still-open classes are not held."""
    day: dict = {"lte": datetime.combine(date_to, time.min)}
    if date_from:
        day["gte"] = datetime.combine(date_from, time.min)
    return {"where": {"status": "CONDUCTED", "isAttendanceLocked": True, "date": day}, "include": {"attendanceRecords": True}}


def _name(student) -> str:
    return f"{student.firstName or ''} {student.lastName or ''}".strip() or student.enrollmentNumber


def _to_data(section) -> SectionData:
    data = SectionData(
        id=section.id,
        class_code=section.group.batch if section.group else section.name,
        subject_code=section.subject.code,
        subject_name=section.subject.name,
        lectures=[Lecture(o.id, o.date.date(), o.startTime, o.endTime) for o in section.occurrences],
        learners=[
            Learner(e.studentId, _name(e.student), e.student.enrollmentNumber, e.enrolledAt.date())
            for e in section.enrollments
        ],
    )
    for occurrence in section.occurrences:
        for record in occurrence.attendanceRecords:
            data.marks[(occurrence.id, record.studentId)] = record.status
    return data


async def load_sections(
    tenant_id: str,
    teacher_id: Optional[str],
    group_id: Optional[str],
    section_id: Optional[str],
    date_from: Optional[date],
    date_to: date,
) -> list[SectionData]:
    sections = await db.coursesection.find_many(
        where=_scope(tenant_id, teacher_id, group_id, section_id),
        include={
            "subject": True,
            "group": True,
            "enrollments": {"where": {"status": "ACTIVE", "endedAt": None}, "include": {"student": True}},
            "occurrences": _held_classes(date_from, date_to),
        },
        order={"name": "asc"},
    )
    return [_to_data(section) for section in sections]


async def load_filters(tenant_id: str, teacher_id: Optional[str]) -> ReportFilters:
    sections = await db.coursesection.find_many(
        where=_scope(tenant_id, teacher_id, None, None),
        include={"subject": True, "group": {"include": {"department": True}}},
        order={"name": "asc"},
    )
    classes = {
        s.group.id: ReportClass(
            id=s.group.id, code=s.group.batch, department_name=s.group.department.name, semester=s.group.semester
        )
        for s in sections
        if s.group
    }
    subjects = [
        ReportSubject(
            section_id=s.id,
            class_id=s.group.id if s.group else None,
            class_code=s.group.batch if s.group else s.name,
            subject_code=s.subject.code,
            subject_name=s.subject.name,
        )
        for s in sections
    ]
    config = await SystemConfigService().get_config(tenant_id=tenant_id)
    return ReportFilters(
        threshold=config.minAttendancePct,
        classes=sorted(classes.values(), key=lambda c: c.code),
        subjects=sorted(subjects, key=lambda s: (s.class_code, s.subject_name)),
    )
