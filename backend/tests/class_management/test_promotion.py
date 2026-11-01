from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
import pytest
from fastapi import HTTPException

from app.schemas.class_management import BacklogEnrollment, PromoteRequest
from app.services.class_management import promotion_service
from class_management_support import TENANT, member, serve_terms, term


def _promotion_setup(fake: MagicMock, members) -> None:
    serve_terms(fake, term("ct-1", members=members))
    fake.academicyear.find_first.return_value = SimpleNamespace(
        id="y-2", startDate=datetime(2026, 1, 1), endDate=datetime(2026, 5, 1)
    )
    fake.coursesection.count.return_value = 1

    async def find_many(where, include=None):
        return members if "classTermId" in where else []

    fake.classmember.find_many = AsyncMock(side_effect=find_many)
    fake.classmember.count.return_value = 0


@pytest.mark.anyio
async def test_promote_dry_run_reports_counts_without_writing(fake_db: MagicMock) -> None:
    members = [member("s1", "E1"), member("s2", "E2"), member("s3", "E3")]
    _promotion_setup(fake_db, members)
    request = PromoteRequest(next_academic_year_id="y-2", dry_run=True, detained_student_ids=["s3"])
    preview = await promotion_service.promote(TENANT, "ct-1", request)
    assert (preview.promoted, preview.detained, preview.graduated) == (2, 1, False)
    fake_db.classmember.update.assert_not_awaited()
    fake_db.classterm.create.assert_not_awaited()
    fake_db.courseenrollment.create.assert_not_awaited()


@pytest.mark.anyio
async def test_promote_commit_moves_detains_and_adds_backlog(fake_db: MagicMock) -> None:
    members = [member("s1", "E1"), member("s2", "E2"), member("s3", "E3")]
    _promotion_setup(fake_db, members)
    next_term = term("ct-2", number=4)
    original = fake_db.classterm.find_first.side_effect

    async def find_first(where, include=None):
        return next_term if where.get("id") == "ct-2" else await original(where, include)

    fake_db.classterm.find_first = AsyncMock(side_effect=find_first)
    fake_db.semester.create.return_value = SimpleNamespace(id="sem-4")
    fake_db.classterm.create.return_value = SimpleNamespace(id="ct-2")
    request = PromoteRequest(
        next_academic_year_id="y-2",
        dry_run=False,
        detained_student_ids=["s3"],
        backlogs=[BacklogEnrollment(student_id="s2", course_section_id="sec-old")],
    )
    preview = await promotion_service.promote(TENANT, "ct-1", request)
    closed = {
        c.kwargs["where"]["classTermId_studentId"]["studentId"]: c.kwargs["data"]["status"]
        for c in fake_db.classmember.update.await_args_list
    }
    assert closed == {"s1": "PROMOTED", "s2": "PROMOTED", "s3": "DETAINED"}
    placed = [c.kwargs["data"]["studentId"] for c in fake_db.classmember.create.await_args_list]
    assert placed == ["s1", "s2"]
    backlog = fake_db.courseenrollment.create.await_args.kwargs["data"]
    assert (backlog["studentId"], backlog["source"]) == ("s2", "BACKLOG")
    assert preview.next_class_id == "ct-2"


@pytest.mark.anyio
async def test_promote_rejects_students_outside_the_class(fake_db: MagicMock) -> None:
    _promotion_setup(fake_db, [member("s1", "E1")])
    request = PromoteRequest(next_academic_year_id="y-2", dry_run=False, detained_student_ids=["stranger"])
    with pytest.raises(HTTPException) as err:
        await promotion_service.promote(TENANT, "ct-1", request)
    assert err.value.status_code == 400
    fake_db.classmember.update.assert_not_awaited()


@pytest.mark.anyio
async def test_promote_final_semester_graduates_group(fake_db: MagicMock) -> None:
    _promotion_setup(fake_db, [member("s1", "E1")])
    serve_terms(fake_db, term("ct-1", members=[member("s1", "E1")], number=8))
    preview = await promotion_service.promote(
        TENANT, "ct-1", PromoteRequest(next_academic_year_id="y-2", dry_run=False)
    )
    assert preview.graduated is True
    assert fake_db.studentgroup.update.await_args.kwargs["data"] == {"status": "GRADUATED"}
    fake_db.classterm.create.assert_not_awaited()
