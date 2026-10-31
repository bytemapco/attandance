from datetime import date, datetime
from types import SimpleNamespace
from unittest.mock import patch
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.services.timetable_service import TimetableService


def _admin_headers() -> dict[str, str]:
    token = create_access_token(subject="user-admin-1", role="ADMIN", extra_data={"tenant_id": "test-tenant-id"})
    return {"X-Tenant-ID": "test-tenant-id", "Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_timetable_sections_crud(async_client: AsyncClient) -> None:
    mock_admin = SimpleNamespace(id="user-admin-1", role="ADMIN", tenantId="test-tenant-id", isActive=True)
    mock_section = SimpleNamespace(
        id="sec-501",
        tenantId="test-tenant-id",
        academicYearId="year-201",
        subjectId="subj-10",
        departmentId="dept-01",
        name="Section A",
        batch="B1",
        defaultRoomId="room-01",
        createdAt=datetime.now(),
        updatedAt=datetime.now(),
        subject=SimpleNamespace(name="Algorithms", code="CS301"),
        defaultRoom=SimpleNamespace(name="Hall 101"),
        enrollments=[],
    )

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=mock_admin), \
         patch.object(TimetableService, "create_course_section", return_value=mock_section), \
         patch.object(TimetableService, "list_course_sections", return_value=[mock_section]), \
         patch.object(TimetableService, "enroll_students_bulk", return_value={"success": True, "enrolled_count": 2}):

        # 1. Create Course Section
        res_create = await async_client.post(
            "/timetable/sections",
            json={
                "academic_term_id": "term-201",
                "subject_id": "subj-10",
                "department_id": "dept-01",
                "name": "Section A",
                "batch": "B1",
            },
            headers=_admin_headers(),
        )
        assert res_create.status_code == 201
        assert res_create.json()["name"] == "Section A"

        # 2. List Course Sections
        res_list = await async_client.get("/timetable/sections?term_id=term-201", headers=_admin_headers())
        assert res_list.status_code == 200
        assert len(res_list.json()) == 1

        # 3. Bulk Enroll Students
        res_enroll = await async_client.post(
            "/timetable/sections/enroll-bulk",
            json={"course_section_id": "sec-501", "student_ids": ["stud-1", "stud-2"]},
            headers=_admin_headers(),
        )
        assert res_enroll.status_code == 200
        assert res_enroll.json()["enrolled_count"] == 2


@pytest.mark.anyio
async def test_timetable_rules_crud(async_client: AsyncClient) -> None:
    mock_admin = SimpleNamespace(id="user-admin-1", role="ADMIN", tenantId="test-tenant-id", isActive=True)
    mock_rule = SimpleNamespace(
        id="rule-601",
        tenantId="test-tenant-id",
        courseSectionId="sec-501",
        timeSlotId="slot-1",
        classroomId="room-01",
        teacherId="teach-10",
        dayOfWeek=1,
        effectiveFrom=date(2025, 8, 1),
        effectiveUntil=date(2025, 12, 15),
        isActive=True,
        timeSlot=SimpleNamespace(name="Slot 1", startTime="09:00", endTime="10:00"),
        teacher=SimpleNamespace(user=SimpleNamespace(name="Dr. Alan Turing"), firstName="Alan", lastName="Turing"),
        classroom=SimpleNamespace(name="Hall 101"),
    )

    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=mock_admin), \
         patch.object(TimetableService, "create_timetable_rule", return_value=mock_rule), \
         patch.object(TimetableService, "list_timetable_rules", return_value=[mock_rule]), \
         patch.object(TimetableService, "delete_timetable_rule", return_value={"success": True}):

        # 1. Create Timetable Rule
        res_create = await async_client.post(
            "/timetable/rules",
            json={
                "course_section_id": "sec-501",
                "time_slot_id": "slot-1",
                "classroom_id": "room-01",
                "teacher_id": "teach-10",
                "day_of_week": 1,
                "effective_from": "2025-08-01",
                "effective_until": "2025-12-15",
            },
            headers=_admin_headers(),
        )
        assert res_create.status_code == 201
        assert res_create.json()["day_of_week"] == 1

        # 2. List Timetable Rules
        res_list = await async_client.get("/timetable/rules?section_id=sec-501", headers=_admin_headers())
        assert res_list.status_code == 200
        assert len(res_list.json()) == 1

        # 3. Delete Timetable Rule
        res_del = await async_client.delete("/timetable/rules/rule-601", headers=_admin_headers())
        assert res_del.status_code == 200
