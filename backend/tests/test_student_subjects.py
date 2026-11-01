from datetime import date, datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from app.services import student_subjects_service as svc

STUDENT = SimpleNamespace(id="stu-1", tenantId="t-1")


def _section(sid: str, name: str, code: str, teacher: bool = True) -> SimpleNamespace:
    teacher_row = SimpleNamespace(isPrimary=True, teacher=SimpleNamespace(firstName="Asha", lastName="Rao"))
    return SimpleNamespace(
        id=sid, name="CSE-A-1", subject=SimpleNamespace(name=name, code=code), faculties=[teacher_row] if teacher else []
    )


def _enrollment(section, enrolled: date = date(2026, 7, 1)) -> SimpleNamespace:
    return SimpleNamespace(
        courseSectionId=section.id, courseSection=section, enrolledAt=datetime.combine(enrolled, datetime.min.time())
    )


def _held(oid: str, sid: str, day: date) -> SimpleNamespace:
    return SimpleNamespace(id=oid, courseSectionId=sid, date=datetime.combine(day, datetime.min.time()))


@pytest.mark.anyio
async def test_subjects_report_hand_computed_percentage() -> None:
    maths, physics = _section("s-m", "Maths", "MA1"), _section("s-p", "Physics", "PH1", teacher=False)
    held = [_held(f"m{i}", "s-m", date(2026, 8, i + 1)) for i in range(4)] + [_held("early", "s-m", date(2026, 6, 1))]
    records = [
        SimpleNamespace(occurrenceId="m0", status="PRESENT"),
        SimpleNamespace(occurrenceId="m1", status="LATE"),
        SimpleNamespace(occurrenceId="m2", status="ABSENT"),
        SimpleNamespace(occurrenceId="early", status="PRESENT"),
    ]
    with patch.object(svc, "db") as db:
        db.courseenrollment.find_many = AsyncMock(return_value=[_enrollment(maths), _enrollment(physics)])
        db.classoccurrence.find_many = AsyncMock(return_value=held)
        db.attendancerecord.find_many = AsyncMock(return_value=records)
        result = await svc.list_subjects(STUDENT)
    by_code = {s.subject_code: s for s in result}
    # 4 held since enrolment (the June class predates it); m3 has no record, so 2 of 4 attended
    assert (by_code["MA1"].conducted, by_code["MA1"].attended, by_code["MA1"].percentage) == (4, 2, 50.0)
    assert by_code["MA1"].teacher_name == "Asha Rao"
    assert (by_code["PH1"].conducted, by_code["PH1"].percentage, by_code["PH1"].teacher_name) == (0, None, None)
    assert [s.subject_name for s in result] == ["Maths", "Physics"]


@pytest.mark.anyio
async def test_live_classes_flag_already_marked() -> None:
    section = _section("s-m", "Maths", "MA1")
    closes = datetime.now(timezone.utc) + timedelta(minutes=20)
    occurrences = [
        SimpleNamespace(
            id=oid, courseSectionId="s-m", courseSection=section, verificationExpires=closes,
            timeSlot=SimpleNamespace(startTime="09:00", endTime="10:00"), classroom=None,
        )
        for oid in ("o1", "o2")
    ]
    with patch.object(svc, "db") as db:
        db.courseenrollment.find_many = AsyncMock(return_value=[_enrollment(section)])
        db.classoccurrence.find_many = AsyncMock(return_value=occurrences)
        db.attendancerecord.find_many = AsyncMock(return_value=[SimpleNamespace(occurrenceId="o1")])
        live = await svc.list_live_classes(STUDENT)
        query = db.classoccurrence.find_many.await_args.kwargs["where"]
    assert [(c.occurrence_id, c.already_marked) for c in live] == [("o1", True), ("o2", False)]
    assert query["verificationActive"] is True and query["isAttendanceLocked"] is False
    assert query["status"] == {"not": "CANCELLED"}
