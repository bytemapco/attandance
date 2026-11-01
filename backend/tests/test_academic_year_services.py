from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
import pytest

from app.core.datetime_utils import get_ist_today
from app.core.security import create_access_token
from app.schemas.academic_year import AcademicYearCreate, TimeSlotCreate
from app.services.academic_year_service import AcademicYearService
from app.services.timeslot_service import TimeSlotService
from app.services.teacher_schedule_service import TeacherScheduleService


def _admin_headers() -> dict[str, str]:
    token = create_access_token(subject="user-admin-1", role="ADMIN", extra_data={"tenant_id": "test-tenant-id"})
    return {"X-Tenant-ID": "test-tenant-id", "Authorization": f"Bearer {token}"}


def _teacher_headers() -> dict[str, str]:
    token = create_access_token(subject="user-teach-1", role="TEACHER", extra_data={"tenant_id": "test-tenant-id"})
    return {"X-Tenant-ID": "test-tenant-id", "Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_academic_year_crud_and_activation() -> None:
    tenant_id = "test-tenant-id"
    mock_year = SimpleNamespace(
        id="year-101",
        tenantId=tenant_id,
        name="Sem 1 — 2025–26",
        startDate=date(2025, 8, 1),
        endDate=date(2025, 12, 15),
        attendanceStartDate=date(2025, 8, 1),
        attendanceEndDate=date(2025, 12, 15),
        minAttendancePct=75.0,
        saturdayEnabled=True,
        verificationWindowMin=60,
        status="PLANNING",
        courseSections=[],
        calendarEvents=[],
    )

    with patch("app.services.academic_year_service.db") as mock_db, \
         patch("app.services.academic_year_service.OccurrenceGenerator.generate_occurrences_for_date", new=AsyncMock(return_value=[])):

        mock_db.academicyear.find_first = AsyncMock(return_value=None)
        mock_db.academicyear.create = AsyncMock(return_value=mock_year)

        # 1. Create Academic Year
        created = await AcademicYearService.create_academic_year(
            tenant_id,
            AcademicYearCreate(
                name="Sem 1 — 2025–26",
                start_date=date(2025, 8, 1),
                end_date=date(2025, 12, 15),
                saturday_enabled=True,
            ),
        )
        assert created.name == "Sem 1 — 2025–26"
        assert created.saturdayEnabled is True

        # 2. Activate Academic Year
        mock_db.academicyear.find_first = AsyncMock(return_value=mock_year)
        mock_db.academicyear.update_many = AsyncMock()
        mock_db.academicyear.update = AsyncMock(return_value=SimpleNamespace(**{**mock_year.__dict__, "status": "ACTIVE"}))

        activated = await AcademicYearService.activate_academic_year(tenant_id, "year-101")
        assert activated.status == "ACTIVE"


@pytest.mark.anyio
async def test_timeslot_service_and_seed() -> None:
    tenant_id = "test-tenant-id"
    mock_slot = SimpleNamespace(
        id="slot-1",
        tenantId=tenant_id,
        slotNumber=1,
        name="Period 1",
        startTime="09:00",
        endTime="10:00",
        isBreak=False,
        isLabBlock=False,
    )

    with patch("app.services.timeslot_service.db") as mock_db:
        mock_db.timeslot.find_first = AsyncMock(return_value=None)
        mock_db.timeslot.create = AsyncMock(return_value=mock_slot)
        mock_db.timeslot.count = AsyncMock(return_value=0)
        mock_db.timeslot.find_many = AsyncMock(return_value=[mock_slot])

        # 1. Create TimeSlot
        slot = await TimeSlotService.create_time_slot(
            tenant_id,
            TimeSlotCreate(slot_number=1, name="Period 1", start_time="09:00", end_time="10:00"),
        )
        assert slot.name == "Period 1"

        # 2. Seed Standard Schedule
        seeded = await TimeSlotService.seed_standard_indian_schedule(tenant_id)
        assert len(seeded) == 7


@pytest.mark.anyio
async def test_teacher_start_stop_attendance_workflow() -> None:
    tenant_id = "test-tenant-id"
    faculty_id = "teach-prof-1"
    user_id = "user-teach-1"

    mock_occ = SimpleNamespace(
        id="occ-1",
        tenantId=tenant_id,
        facultyId=faculty_id,
        substituteFacultyId=None,
        isAttendanceLocked=False,
        status="SCHEDULED",
        date=datetime.combine(get_ist_today(), datetime.min.time()),
        courseSection=SimpleNamespace(
            academicYear=SimpleNamespace(verificationWindowMin=45),
            enrollments=[
                SimpleNamespace(
                    student=SimpleNamespace(id="stud-1", leaveRequests=[])
                )
            ],
        ),
        attendanceRecords=[],
    )

    with patch("app.services.teacher_schedule_service.db") as mock_db:
        mock_db.classoccurrence.find_first = AsyncMock(return_value=mock_occ)
        mock_db.classoccurrence.update = AsyncMock(return_value=SimpleNamespace(**{**mock_occ.__dict__, "verificationActive": True}))
        mock_db.attendancerecord.create = AsyncMock(return_value=SimpleNamespace(id="rec-1"))
        mock_db.attendanceauditlog.create = AsyncMock()

        # 1. Start Attendance
        started = await TeacherScheduleService.start_occurrence_attendance(tenant_id, faculty_id, "occ-1")
        assert started.verificationActive is True

        # 2. Stop Attendance
        stopped = await TeacherScheduleService.stop_occurrence_attendance(tenant_id, faculty_id, user_id, "occ-1")
        assert stopped["success"] is True
        assert stopped["absent_marked_count"] == 1
        assert mock_db.attendanceauditlog.create.call_count == 1
