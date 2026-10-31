from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.services.occurrence_register_service import OccurrenceRegisterService


def _teacher_headers() -> dict[str, str]:
    token = create_access_token(subject="user-teach-1", role="TEACHER", extra_data={"tenant_id": "test-tenant-id"})
    return {"X-Tenant-ID": "test-tenant-id", "Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_faculty_daily_schedule_endpoint(async_client: AsyncClient) -> None:
    mock_teacher_user = SimpleNamespace(id="user-teach-1", role="TEACHER", tenantId="test-tenant-id", isActive=True)
    mock_teacher_profile = SimpleNamespace(id="teach-prof-1", userId="user-teach-1", tenantId="test-tenant-id")

    mock_occ = SimpleNamespace(
        id="occ-801",
        tenantId="test-tenant-id",
        courseSectionId="sec-501",
        date=datetime(2025, 9, 1),
        timeSlotId="slot-1",
        classroomId="room-01",
        facultyId="teach-prof-1",
        substituteFacultyId=None,
        status="SCHEDULED",
        isAttendanceLocked=False,
        courseSection=SimpleNamespace(
            name="Section A",
            subject=SimpleNamespace(name="Algorithms", code="CS301"),
            enrollments=[SimpleNamespace(), SimpleNamespace()],
        ),
        classroom=SimpleNamespace(name="Hall 101"),
        faculty=SimpleNamespace(user=SimpleNamespace(name="Dr. Alan Turing")),
        timeSlot=SimpleNamespace(startTime="09:00", endTime="10:00"),
        attendanceRecords=[],
    )

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=mock_teacher_user), \
         patch("app.repositories.teacher_repository.TeacherRepository.get_by_user_id", return_value=mock_teacher_profile), \
         patch.object(OccurrenceRegisterService, "get_daily_schedule", return_value=[mock_occ]):

        res = await async_client.get("/faculty/daily-schedule?target_date=2025-09-01", headers=_teacher_headers())
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["course_name"] == "Algorithms"
        assert data[0]["total_enrolled"] == 2


@pytest.mark.anyio
async def test_faculty_occurrence_register_get_and_put(async_client: AsyncClient) -> None:
    mock_teacher_user = SimpleNamespace(id="user-teach-1", role="TEACHER", tenantId="test-tenant-id", isActive=True)

    register_payload = {
        "occurrence_id": "occ-801",
        "date": "2025-09-01",
        "status": "SCHEDULED",
        "is_attendance_locked": False,
        "course_name": "Algorithms",
        "section_name": "Section A",
        "time_slot": "09:00 - 10:00",
        "students": [
            {
                "student_id": "stud-1",
                "student_name": "Ada Lovelace",
                "enrollment_number": "CS2025001",
                "status": "ABSENT",
                "method": "MANUAL_REGISTER",
                "remarks": None,
            }
        ],
    }

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=mock_teacher_user), \
         patch.object(OccurrenceRegisterService, "get_occurrence_register", return_value=register_payload), \
         patch.object(OccurrenceRegisterService, "update_register_bulk", return_value={"success": True, "records_processed": 1}):

        # 1. Get register
        res_get = await async_client.get("/faculty/occurrences/occ-801/register", headers=_teacher_headers())
        assert res_get.status_code == 200
        assert res_get.json()["course_name"] == "Algorithms"
        assert len(res_get.json()["students"]) == 1

        # 2. Put register updates
        res_put = await async_client.put(
            "/faculty/occurrences/occ-801/register",
            json={
                "occurrence_id": "occ-801",
                "updates": [{"student_id": "stud-1", "status": "PRESENT", "remarks": "Present on time"}],
                "reason": "Conducted morning lecture",
            },
            headers=_teacher_headers(),
        )
        assert res_put.status_code == 200
        assert res_put.json()["records_processed"] == 1
