from datetime import date
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
import pytest

from app.schemas.timetable import TimetableRuleCreate, AttendanceRegisterItem
from app.services.timetable_service import TimetableService
from app.services.occurrence_generator import OccurrenceGenerator
from app.services.occurrence_register_service import OccurrenceRegisterService


@pytest.mark.anyio
async def test_complete_institutional_academic_attendance_workflow() -> None:
    tenant_id = "inst-tenant-999"

    # Step 3: Holiday Suppression Test
    holiday = SimpleNamespace(eventType="HOLIDAY", substituteDayOfWeek=None)
    with patch("app.services.occurrence_generator.db") as mock_db:
        mock_db.academiccalendarevent.find_many = AsyncMock(return_value=[holiday])
        holiday_occurrences = await OccurrenceGenerator.generate_occurrences_for_date(tenant_id, date(2025, 8, 15))
        assert holiday_occurrences == []  # Completely suppressed

    # Step 4: Timetable Rule Collision Rejection
    with patch("app.services.timetable_service.db") as mock_db:
        mock_db.timetablerule.find_unique = AsyncMock(return_value=SimpleNamespace(id="existing-rule"))
        with pytest.raises(Exception) as exc:
            await TimetableService.create_timetable_rule(
                tenant_id,
                TimetableRuleCreate(
                    course_section_id="sec-1",
                    time_slot_id="slot-1",
                    day_of_week=1,
                    effective_from=date(2025, 8, 1),
                    effective_until=date(2025, 12, 15),
                ),
            )
        assert "Timetable slot collision" in str(exc.value)

    # Step 5: Occurrence Generation on Instructional Day
    mock_rule = SimpleNamespace(
        id="rule-1",
        courseSectionId="sec-1",
        timeSlotId="slot-1",
        classroomId="room-101",
        teacherId="teach-1",
        courseSection=SimpleNamespace(faculties=[SimpleNamespace(teacherId="teach-1")], defaultRoomId="room-101"),
    )
    mock_occurrence = SimpleNamespace(id="occ-1", status="SCHEDULED")
    with patch("app.services.occurrence_generator.db") as mock_db:
        mock_db.academiccalendarevent.find_many = AsyncMock(return_value=[])  # No holidays
        mock_db.timetablerule.find_many = AsyncMock(return_value=[mock_rule])
        mock_db.classoccurrence.find_unique = AsyncMock(return_value=None)
        mock_db.classoccurrence.create = AsyncMock(return_value=mock_occurrence)

        occurrences = await OccurrenceGenerator.generate_occurrences_for_date(tenant_id, date(2025, 9, 1))
        assert len(occurrences) == 1
        assert occurrences[0].status == "SCHEDULED"

    # Step 6: Attendance Register Submission, Status Transition, and Audit Log
    mock_occ = SimpleNamespace(id="occ-1", courseSectionId="sec-1", isAttendanceLocked=False, status="SCHEDULED")
    mock_rec = SimpleNamespace(id="rec-1", status="ABSENT", remarks=None)
    with patch("app.services.occurrence_register_service.db") as mock_db:
        mock_db.classoccurrence.find_first = AsyncMock(return_value=mock_occ)
        mock_db.attendancerecord.find_unique = AsyncMock(return_value=mock_rec)
        mock_db.attendanceauditlog.create = AsyncMock()
        mock_db.attendancerecord.update = AsyncMock()
        mock_db.classoccurrence.update = AsyncMock()
        mock_db.courseenrollment.find_many = AsyncMock(
            return_value=[SimpleNamespace(studentId="stud-1"), SimpleNamespace(studentId="stud-2")]
        )

        result = await OccurrenceRegisterService.update_register_bulk(
            tenant_id=tenant_id,
            user=SimpleNamespace(id="user-admin-1", role="ADMIN"),
            occurrence_id="occ-1",
            updates=[
                AttendanceRegisterItem(student_id="stud-1", status="PRESENT", remarks="Attended"),
                AttendanceRegisterItem(student_id="stud-2", status="LATE", remarks="Arrived 15m late"),
            ],
            reason="Conducted Lecture 1",
        )
        assert result["success"] is True
        assert result["records_processed"] == 2
        assert mock_db.attendanceauditlog.create.call_count == 2
        mock_db.classoccurrence.update.assert_called_once()

    # Step 7: Locked Occurrence Attendance Immutability
    locked_occ = SimpleNamespace(id="occ-locked", isAttendanceLocked=True)
    with patch("app.services.occurrence_register_service.db") as mock_db:
        mock_db.classoccurrence.find_first = AsyncMock(return_value=locked_occ)
        with pytest.raises(Exception) as exc:
            await OccurrenceRegisterService.update_register_bulk(
                tenant_id=tenant_id,
                user=SimpleNamespace(id="user-admin-1", role="ADMIN"),
                occurrence_id="occ-locked",
                updates=[AttendanceRegisterItem(student_id="stud-1", status="PRESENT")],
            )
        assert "locked and cannot be modified" in str(exc.value)
