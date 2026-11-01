from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

TENANT = "test-tenant-id"


def member(student_id: str, enrollment: str) -> SimpleNamespace:
    student = SimpleNamespace(enrollmentNumber=enrollment, firstName="Stu", lastName=student_id)
    return SimpleNamespace(studentId=student_id, status="ACTIVE", student=student)


def section(section_id: str, subject_id: str = "subj-1", teacher_id: str | None = None) -> SimpleNamespace:
    teacher = SimpleNamespace(id=teacher_id, firstName="Tea", lastName="Cher") if teacher_id else None
    faculties = [SimpleNamespace(isPrimary=True, teacher=teacher, teacherId=teacher_id)] if teacher else []
    return SimpleNamespace(
        id=section_id, name="CE-A", subjectId=subject_id, defaultRoom=None, defaultRoomId=None,
        subject=SimpleNamespace(name="Algorithms", code="CS301"), faculties=faculties, enrollments=[], timetableRules=[],
    )


def term(
    term_id: str = "ct-1", members=(), sections=(), number: int = 3, batch: str = "A", dept: str = "CE",
    batch_id: str | None = None,
):
    department = SimpleNamespace(code=dept, name="Computer Engineering")
    group = SimpleNamespace(
        id="g-1", departmentId="d-1", department=department, batch=batch, batchId=batch_id, status="ACTIVE"
    )
    semester = SimpleNamespace(
        number=number, academicYearId="y-1", academicYear=SimpleNamespace(name="2025-26"),
        startDate=date(2025, 7, 1), endDate=date(2025, 12, 31),
    )
    return SimpleNamespace(
        id=term_id, groupId="g-1", group=group, semester=semester, createdAt=datetime(2025, 8, 1),
        members=list(members), courseSections=list(sections),
    )


def serve_terms(fake: MagicMock, *terms) -> None:
    by_id = {t.id: t for t in terms}

    async def find_first(where, include=None):
        return by_id.get(where.get("id"))

    fake.classterm.find_first = AsyncMock(side_effect=find_first)
