from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi import HTTPException

from app.schemas.class_management import ClassSectionCreate, ClassSectionUpdate
from app.services.class_management import class_section_service
from class_management_support import TENANT, member, section, serve_terms, term


def _setup_lookups(fake: MagicMock) -> None:
    fake.subject.find_first.return_value = SimpleNamespace(id="subj-1")
    fake.teacher.find_first.return_value = SimpleNamespace(id="t-1")
    fake.coursesection.create.return_value = SimpleNamespace(id="sec-new")


@pytest.mark.anyio
async def test_add_subject_creates_section_teacher_and_enrols_class(fake_db: MagicMock) -> None:
    _setup_lookups(fake_db)
    serve_terms(fake_db, term(members=[member("s1", "E1"), member("s2", "E2")]))
    detail = await class_section_service.create_section(
        TENANT, "ct-1", ClassSectionCreate(subject_id="subj-1", primary_teacher_id="t-1")
    )
    created = fake_db.coursesection.create.await_args.kwargs["data"]
    assert (created["tenantId"], created["classTermId"], created["name"]) == (TENANT, "ct-1", "CE-A")
    assert fake_db.coursefaculty.create.await_args.kwargs["data"]["teacherId"] == "t-1"
    enrolled = [c.kwargs["data"]["studentId"] for c in fake_db.courseenrollment.create.await_args_list]
    assert enrolled == ["s1", "s2"]
    assert detail.code == "CE-A"


@pytest.mark.anyio
async def test_add_subject_rejects_duplicate_and_unknown_teacher(fake_db: MagicMock) -> None:
    _setup_lookups(fake_db)
    serve_terms(fake_db, term(sections=[section("sec-1", "subj-1")]))
    with pytest.raises(HTTPException) as dup:
        await class_section_service.create_section(TENANT, "ct-1", ClassSectionCreate(subject_id="subj-1"))
    assert dup.value.status_code == 409
    fake_db.teacher.find_first.return_value = None
    with pytest.raises(HTTPException) as missing:
        await class_section_service.create_section(
            TENANT, "ct-1", ClassSectionCreate(subject_id="subj-1", primary_teacher_id="ghost")
        )
    assert missing.value.status_code == 404
    fake_db.coursesection.create.assert_not_awaited()


@pytest.mark.anyio
async def test_change_teacher_updates_faculty_rules_and_upcoming_classes(fake_db: MagicMock) -> None:
    _setup_lookups(fake_db)
    serve_terms(fake_db, term(sections=[section("sec-1", "subj-1", teacher_id="t-old")]))
    await class_section_service.update_section(
        TENANT, "ct-1", "sec-1", ClassSectionUpdate(primary_teacher_id="t-1")
    )
    assert fake_db.coursefaculty.delete_many.await_args.kwargs["where"] == {"courseSectionId": "sec-1", "isPrimary": True}
    assert fake_db.coursefaculty.create.await_args.kwargs["data"]["teacherId"] == "t-1"
    assert fake_db.timetablerule.update_many.await_args.kwargs["data"] == {"teacherId": "t-1"}
    occurrences = fake_db.classoccurrence.update_many.await_args.kwargs
    assert occurrences["data"] == {"facultyId": "t-1"}
    assert occurrences["where"]["status"] == "SCHEDULED" and occurrences["where"]["isAttendanceLocked"] is False


@pytest.mark.anyio
async def test_change_teacher_for_a_subject_of_another_class_is_404(fake_db: MagicMock) -> None:
    _setup_lookups(fake_db)
    serve_terms(fake_db, term(sections=[section("sec-1")]))
    with pytest.raises(HTTPException) as err:
        await class_section_service.update_section(
            TENANT, "ct-1", "other-class-section", ClassSectionUpdate(primary_teacher_id="t-1")
        )
    assert err.value.status_code == 404
    fake_db.coursefaculty.create.assert_not_awaited()


@pytest.mark.anyio
async def test_remove_subject_deletes_when_no_attendance(fake_db: MagicMock) -> None:
    serve_terms(fake_db, term(sections=[section("sec-1")]))
    await class_section_service.delete_section(TENANT, "ct-1", "sec-1")
    assert fake_db.coursesection.delete.await_args.kwargs["where"] == {"id": "sec-1"}


@pytest.mark.anyio
async def test_remove_subject_blocked_once_attendance_exists(fake_db: MagicMock) -> None:
    serve_terms(fake_db, term(sections=[section("sec-1")]))
    fake_db.attendancerecord.count = AsyncMock(return_value=4)
    with pytest.raises(HTTPException) as err:
        await class_section_service.delete_section(TENANT, "ct-1", "sec-1")
    assert err.value.status_code == 409
    fake_db.coursesection.delete.assert_not_awaited()
