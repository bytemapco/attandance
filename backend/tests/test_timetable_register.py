from datetime import date, datetime
from unittest.mock import AsyncMock, patch
import pytest

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
        data = await OccurrenceRegisterService.get_occurrence_register("tenant-123", "occ-1")
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

        result = await OccurrenceRegisterService.update_register_bulk(
            tenant_id="tenant-123",
            user_id="teacher-1",
            occurrence_id="occ-1",
            updates=[AttendanceRegisterItem(student_id="stud-1", status="PRESENT", remarks="On time")],
            reason="Morning register check",
        )
        assert result["success"] is True
        assert result["records_processed"] == 1
        mock_db.attendancerecord.create.assert_called_once()
        mock_db.attendanceauditlog.create.assert_called_once()
