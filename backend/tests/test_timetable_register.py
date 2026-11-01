from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
import pytest
from fastapi import HTTPException

from app.schemas.timetable import TimetableRuleCreate, AttendanceRegisterItem
from app.services.timetable_service import TimetableService
from app.services.occurrence_generator import OccurrenceGenerator
from app.services.occurrence_register_service import OccurrenceRegisterService


@pytest.mark.anyio
async def test_timetable_rule_date_validation() -> None:
    # effective_from >= effective_until must raise 400
    with pytest.raises(Exception) as excinfo:
        await TimetableService.create_timetable_rule(
            tenant_id="tenant-123",
            data=TimetableRuleCreate(
                course_section_id="sec-1",
                time_slot_id="slot-1",
                day_of_week=1,
                effective_from=date(2025, 12, 31),
                effective_until=date(2025, 1, 1),
            ),
        )
    assert "effective_from must be before effective_until" in str(excinfo.value)


@pytest.mark.anyio
async def test_occurrence_generator_suppresses_holidays() -> None:
    mock_holiday = AsyncMock(eventType="HOLIDAY", substituteDayOfWeek=None)
    with patch("app.services.occurrence_generator.db") as mock_db:
        mock_db.academiccalendarevent.find_many = AsyncMock(return_value=[mock_holiday])
        result = await OccurrenceGenerator.generate_occurrences_for_date(
            tenant_id="tenant-123",
            target_date=date(2025, 8, 15),
        )
        assert result == []


@pytest.mark.anyio
async def test_occurrence_register_retrieval() -> None:
    mock_student = AsyncMock(id="stud-1", enrollmentNumber="CS2025001", firstName="John", lastName="Doe")
    mock_user = AsyncMock()
    mock_user.name = "John Doe"
    mock_student.user = mock_user
    mock_enrollment = AsyncMock(student=mock_student)
    mock_occurrence = AsyncMock(
        id="occ-1",
        date=datetime(2025, 9, 1),
        status="SCHEDULED",
        isAttendanceLocked=False,
        courseSection=AsyncMock(
            name="Section A",
            subject=AsyncMock(name="Data Structures"),
            enrollments=[mock_enrollment],
        ),
        timeSlot=AsyncMock(startTime="09:00", endTime="10:00"),
        attendanceRecords=[],
    )

    with patch("app.services.occurrence_register_service.db") as mock_db:
        mock_db.classoccurrence.find_first = AsyncMock(return_value=mock_occurrence)
        data = await OccurrenceRegisterService.get_occurrence_register(
            "tenant-123", "occ-1", SimpleNamespace(id="admin-1", role="ADMIN")
        )
        assert data["occurrence_id"] == "occ-1"
        assert len(data["students"]) == 1
        assert data["students"][0]["student_name"] == "John Doe"
        assert data["students"][0]["status"] == "ABSENT"


@pytest.mark.anyio
async def test_register_bulk_update_and_audit_log() -> None:
    mock_occurrence = AsyncMock(id="occ-1", isAttendanceLocked=False)
    with patch("app.services.occurrence_register_service.db") as mock_db:
        mock_db.classoccurrence.find_first = AsyncMock(return_value=mock_occurrence)
        mock_db.attendancerecord.find_unique = AsyncMock(return_value=None)
        mock_db.attendancerecord.create = AsyncMock(return_value=AsyncMock(id="rec-1"))
        mock_db.attendanceauditlog.create = AsyncMock(return_value=AsyncMock(id="audit-1"))
        mock_db.classoccurrence.update = AsyncMock()
        mock_db.courseenrollment.find_many = AsyncMock(return_value=[SimpleNamespace(studentId="stud-1")])

        result = await OccurrenceRegisterService.update_register_bulk(
            tenant_id="tenant-123",
            user=SimpleNamespace(id="admin-1", role="ADMIN"),
            occurrence_id="occ-1",
            updates=[AttendanceRegisterItem(student_id="stud-1", status="PRESENT", remarks="On time")],
            reason="Morning register check",
        )
        assert result["success"] is True
        assert result["records_processed"] == 1
        mock_db.attendancerecord.create.assert_called_once()
        mock_db.attendanceauditlog.create.assert_called_once()


def _occurrence(**overrides) -> SimpleNamespace:
    base = dict(
        id="occ-1", tenantId="tenant-123", courseSectionId="sec-1", facultyId="teach-owner",
        substituteFacultyId=None, isAttendanceLocked=False,
    )
    return SimpleNamespace(**{**base, **overrides})


@pytest.mark.anyio
async def test_register_update_rejects_teacher_not_assigned_to_class() -> None:
    outsider = SimpleNamespace(id="user-outsider", role="TEACHER")
    with patch("app.services.occurrence_register_service.db") as mock_db:
        mock_db.classoccurrence.find_first = AsyncMock(return_value=_occurrence())
        mock_db.teacher.find_first = AsyncMock(return_value=SimpleNamespace(id="teach-other"))
        with pytest.raises(HTTPException) as exc:
            await OccurrenceRegisterService.update_register_bulk(
                "tenant-123", outsider, "occ-1", [AttendanceRegisterItem(student_id="stud-1", status="PRESENT")]
            )
        assert exc.value.status_code == 403


@pytest.mark.anyio
async def test_register_update_allows_substitute_teacher() -> None:
    substitute = SimpleNamespace(id="user-sub", role="TEACHER")
    with patch("app.services.occurrence_register_service.db") as mock_db:
        mock_db.classoccurrence.find_first = AsyncMock(return_value=_occurrence(substituteFacultyId="teach-sub"))
        mock_db.teacher.find_first = AsyncMock(return_value=SimpleNamespace(id="teach-sub"))
        mock_db.courseenrollment.find_many = AsyncMock(return_value=[SimpleNamespace(studentId="stud-1")])
        mock_db.attendancerecord.find_unique = AsyncMock(return_value=None)
        mock_db.attendancerecord.create = AsyncMock(return_value=SimpleNamespace(id="rec-1"))
        mock_db.attendanceauditlog.create = AsyncMock()
        mock_db.classoccurrence.update = AsyncMock()
        result = await OccurrenceRegisterService.update_register_bulk(
            "tenant-123", substitute, "occ-1", [AttendanceRegisterItem(student_id="stud-1", status="PRESENT")]
        )
        assert result["records_processed"] == 1


@pytest.mark.anyio
async def test_register_read_rejects_teacher_not_assigned_to_class() -> None:
    outsider = SimpleNamespace(id="user-outsider", role="TEACHER")
    with patch("app.services.occurrence_register_service.db") as mock_db:
        mock_db.classoccurrence.find_first = AsyncMock(return_value=_occurrence())
        mock_db.teacher.find_first = AsyncMock(return_value=None)
        with pytest.raises(HTTPException) as exc:
            await OccurrenceRegisterService.get_occurrence_register("tenant-123", "occ-1", outsider)
        assert exc.value.status_code == 403


@pytest.mark.anyio
async def test_register_update_rejects_students_not_enrolled_in_section() -> None:
    admin = SimpleNamespace(id="admin-1", role="ADMIN")
    with patch("app.services.occurrence_register_service.db") as mock_db:
        mock_db.classoccurrence.find_first = AsyncMock(return_value=_occurrence())
        mock_db.courseenrollment.find_many = AsyncMock(return_value=[SimpleNamespace(studentId="stud-1")])
        mock_db.attendancerecord.create = AsyncMock()
        with pytest.raises(HTTPException) as exc:
            await OccurrenceRegisterService.update_register_bulk(
                "tenant-123", admin, "occ-1",
                [AttendanceRegisterItem(student_id="stud-1", status="PRESENT"),
                 AttendanceRegisterItem(student_id="stranger", status="PRESENT")],
            )
        assert exc.value.status_code == 400
        mock_db.attendancerecord.create.assert_not_called()


def test_register_item_rejects_non_manual_statuses() -> None:
    with pytest.raises(ValueError):
        AttendanceRegisterItem(student_id="stud-1", status="APPROVED")
