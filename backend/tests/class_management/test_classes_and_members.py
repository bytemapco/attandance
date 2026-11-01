from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import HTTPException
from httpx import AsyncClient

from app.core.security import create_access_token
from app.schemas.class_management import ClassCreate, ClassMemberMove
from app.services.class_management import (
    class_member_service,
    class_term_service,
    common,
)
from class_management_support import TENANT, member, section, serve_terms, term


@pytest.mark.anyio
async def test_get_class_filters_by_tenant_and_404s(fake_db: MagicMock) -> None:
    with pytest.raises(HTTPException) as err:
        await common.get_class_term(TENANT, "missing")
    assert err.value.status_code == 404
    assert fake_db.classterm.find_first.await_args.kwargs["where"] == {"id": "missing", "tenantId": TENANT}


def _batch(code: str = "CE-A-1", batch_id: str = "b-1", dept_id: str = "d-1", status: str = "ACTIVE"):
    return SimpleNamespace(id=batch_id, code=code, departmentId=dept_id, status=status)


def _year():
    return SimpleNamespace(id="y-1", startDate=datetime(2025, 8, 1), endDate=datetime(2025, 12, 1))


@pytest.mark.anyio
async def test_create_class_rejects_duplicate_semester_class(fake_db: MagicMock) -> None:
    fake_db.department.find_first.return_value = SimpleNamespace(id="d-1", code="CE")
    fake_db.academicyear.find_first.return_value = _year()
    fake_db.batch.find_first.return_value = _batch()
    fake_db.studentgroup.find_first.return_value = SimpleNamespace(id="g-1", status="ACTIVE", batchId="b-1")
    fake_db.semester.find_first.return_value = SimpleNamespace(id="s-3")
    fake_db.classterm.find_first.return_value = SimpleNamespace(id="ct-1")
    data = ClassCreate(department_id="d-1", batch_id="b-1", academic_year_id="y-1", semester_number=3)
    with pytest.raises(HTTPException) as err:
        await class_term_service.create_class(TENANT, data)
    assert err.value.status_code == 409
    assert "CE-A-1" in err.value.detail


@pytest.mark.anyio
async def test_create_class_creates_group_semester_and_term(fake_db: MagicMock) -> None:
    fake_db.department.find_first.return_value = SimpleNamespace(id="d-1", code="CE")
    fake_db.academicyear.find_first.return_value = _year()
    fake_db.batch.find_first.return_value = _batch()
    fake_db.studentgroup.create.return_value = SimpleNamespace(id="g-1")
    fake_db.semester.create.return_value = SimpleNamespace(id="s-3")
    fake_db.classterm.create.return_value = SimpleNamespace(id="ct-1")
    fake_db.classterm.find_first = AsyncMock(side_effect=[None, term(batch="CE-A-1", batch_id="b-1")])
    data = ClassCreate(department_id="d-1", batch_id="b-1", academic_year_id="y-1", semester_number=3)
    detail = await class_term_service.create_class(TENANT, data)
    assert detail.code == "CE-A-1"
    assert fake_db.studentgroup.create.await_args.kwargs["data"] == {
        "tenantId": TENANT, "departmentId": "d-1", "batch": "CE-A-1", "batchId": "b-1",
    }
    assert fake_db.semester.create.await_args.kwargs["data"]["number"] == 3


@pytest.mark.anyio
async def test_create_class_places_selected_students_and_rejects_busy_ones(fake_db: MagicMock) -> None:
    fake_db.department.find_first.return_value = SimpleNamespace(id="d-1", code="CSE")
    fake_db.academicyear.find_first.return_value = _year()
    fake_db.batch.find_first.return_value = _batch(code="CSE-A-1")
    fake_db.student.find_many.return_value = [SimpleNamespace(id="s1"), SimpleNamespace(id="s2")]
    fake_db.studentgroup.create.return_value = SimpleNamespace(id="g-1")
    fake_db.semester.create.return_value = SimpleNamespace(id="s-4")
    fake_db.classterm.create.return_value = SimpleNamespace(id="ct-1")
    class_term = term(batch="CSE-A-1", dept="CSE")
    fake_db.classterm.find_first = AsyncMock(side_effect=[None, class_term, class_term])
    data = ClassCreate(
        department_id="d-1", batch_id="b-1", academic_year_id="y-1", semester_number=4, student_ids=["s1", "s2"]
    )
    detail = await class_term_service.create_class(TENANT, data)
    assert detail.code == "CSE-A-1"
    placed = [c.kwargs["data"]["studentId"] for c in fake_db.classmember.create.await_args_list]
    assert placed == ["s1", "s2"]

    fake_db.classmember.create.reset_mock()
    fake_db.classmember.count.return_value = 1
    with pytest.raises(HTTPException) as err:
        await class_term_service.create_class(TENANT, data)
    assert err.value.status_code == 409
    fake_db.classterm.create.assert_awaited_once()
    fake_db.classmember.create.assert_not_awaited()


@pytest.mark.anyio
async def test_create_class_rejects_archived_or_foreign_batch(fake_db: MagicMock) -> None:
    fake_db.department.find_first.return_value = SimpleNamespace(id="d-1", code="CE")
    fake_db.academicyear.find_first.return_value = _year()
    data = ClassCreate(department_id="d-1", batch_id="b-1", academic_year_id="y-1", semester_number=3)

    fake_db.batch.find_first.return_value = _batch(status="ARCHIVED")
    with pytest.raises(HTTPException) as err:
        await class_term_service.create_class(TENANT, data)
    assert err.value.status_code == 400

    fake_db.batch.find_first.return_value = _batch(dept_id="d-other")
    with pytest.raises(HTTPException) as err:
        await class_term_service.create_class(TENANT, data)
    assert err.value.status_code == 400

    fake_db.batch.find_first.return_value = None
    with pytest.raises(HTTPException) as err:
        await class_term_service.create_class(TENANT, data)
    assert err.value.status_code == 404


@pytest.mark.anyio
async def test_add_members_rejects_students_outside_the_class_batch(fake_db: MagicMock) -> None:
    serve_terms(fake_db, term("ct-1", batch="CE-A-1", batch_id="b-1"))
    fake_db.student.find_many.return_value = [SimpleNamespace(id="s1")]
    fake_db.student.count.return_value = 1
    with pytest.raises(HTTPException) as err:
        await class_member_service.add_members(TENANT, "ct-1", ["s1"])
    assert err.value.status_code == 400
    where = fake_db.student.count.await_args.kwargs["where"]
    assert where["OR"] == [{"batchId": None}, {"batchId": {"not": "b-1"}}]
    fake_db.classmember.create.assert_not_awaited()


@pytest.mark.anyio
async def test_create_class_rolls_back_the_class_row_when_a_later_step_fails(fake_db: MagicMock) -> None:
    fake_db.department.find_first.return_value = SimpleNamespace(id="d-1", code="CE")
    fake_db.academicyear.find_first.return_value = _year()
    fake_db.batch.find_first.return_value = _batch()
    fake_db.studentgroup.create.return_value = SimpleNamespace(id="g-1")
    fake_db.semester.create.return_value = SimpleNamespace(id="s-3")
    fake_db.classterm.create.return_value = SimpleNamespace(id="ct-1")
    fake_db.classterm.find_first = AsyncMock(side_effect=[None, RuntimeError("read-back failed")])
    data = ClassCreate(department_id="d-1", batch_id="b-1", academic_year_id="y-1", semester_number=3)
    with pytest.raises(RuntimeError):
        await class_term_service.create_class(TENANT, data)
    assert fake_db.classterm.delete.await_args.kwargs["where"] == {"id": "ct-1"}


@pytest.mark.anyio
async def test_create_class_reactivates_a_graduated_batch(fake_db: MagicMock) -> None:
    fake_db.department.find_first.return_value = SimpleNamespace(id="d-1", code="CE")
    fake_db.academicyear.find_first.return_value = _year()
    fake_db.batch.find_first.return_value = _batch()
    fake_db.studentgroup.find_first.return_value = SimpleNamespace(id="g-1", status="GRADUATED", batchId="b-1")
    fake_db.studentgroup.update.return_value = SimpleNamespace(id="g-1", status="ACTIVE")
    fake_db.semester.find_first.return_value = SimpleNamespace(id="s-1")
    fake_db.classterm.create.return_value = SimpleNamespace(id="ct-1")
    fake_db.classterm.find_first = AsyncMock(side_effect=[None, term(batch="CE-A-1", batch_id="b-1")])
    await class_term_service.create_class(
        TENANT, ClassCreate(department_id="d-1", batch_id="b-1", academic_year_id="y-1", semester_number=1)
    )
    assert fake_db.studentgroup.update.await_args.kwargs["data"] == {"status": "ACTIVE", "batchId": "b-1"}


def test_class_code_does_not_repeat_the_department_prefix() -> None:
    assert common.class_code("CSE", "CSE-A-1") == "CSE-A-1"
    assert common.class_code("CSE", "cse-a-1") == "cse-a-1"
    assert common.class_code("CE", "A") == "CE-A"


@pytest.mark.anyio
async def test_add_members_rejects_student_active_in_another_class(fake_db: MagicMock) -> None:
    serve_terms(fake_db, term())
    fake_db.student.find_many.return_value = [SimpleNamespace(id="s1")]
    fake_db.classmember.find_many.return_value = [SimpleNamespace(studentId="s1", classTermId="ct-other")]
    with pytest.raises(HTTPException) as err:
        await class_member_service.add_members(TENANT, "ct-1", ["s1"])
    assert err.value.status_code == 409
    fake_db.classmember.create.assert_not_awaited()


@pytest.mark.anyio
async def test_add_members_enrolls_students_in_every_subject_of_the_class(fake_db: MagicMock) -> None:
    serve_terms(fake_db, term(sections=[section("sec-1", "subj-1"), section("sec-2", "subj-2")]))
    fake_db.student.find_many.return_value = [SimpleNamespace(id="s1")]
    await class_member_service.add_members(TENANT, "ct-1", ["s1"])
    created = [c.kwargs["data"] for c in fake_db.courseenrollment.create.await_args_list]
    assert [(c["courseSectionId"], c["source"]) for c in created] == [("sec-1", "CLASS"), ("sec-2", "CLASS")]


@pytest.mark.anyio
async def test_move_member_closes_old_row_before_placing_in_target(fake_db: MagicMock) -> None:
    serve_terms(fake_db, term("ct-1", members=[member("s1", "E1")]), term("ct-2"))
    order: list[str] = []
    fake_db.classmember.update = AsyncMock(side_effect=lambda **kw: order.append(f"update:{kw['data']['status']}"))
    fake_db.classmember.create = AsyncMock(side_effect=lambda **kw: order.append("create"))
    await class_member_service.move_member(
        TENANT, "ct-1", "s1", ClassMemberMove(target_class_id="ct-2", reason="Division change")
    )
    assert order == ["update:TRANSFERRED", "create"]


@pytest.mark.anyio
async def test_move_member_requires_active_membership(fake_db: MagicMock) -> None:
    serve_terms(fake_db, term("ct-1"), term("ct-2"))
    with pytest.raises(HTTPException) as err:
        await class_member_service.move_member(
            TENANT, "ct-1", "ghost", ClassMemberMove(target_class_id="ct-2", reason="Division change")
        )
    assert err.value.status_code == 404


def _headers(role: str) -> dict[str, str]:
    token = create_access_token(subject="user-1", role=role, extra_data={"tenant_id": TENANT})
    return {"X-Tenant-ID": TENANT, "Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_class_management_endpoints_are_admin_only(async_client: AsyncClient) -> None:
    teacher = SimpleNamespace(id="user-1", role="TEACHER", tenantId=TENANT, isActive=True)
    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=teacher):
        response = await async_client.get("/admin/class-management/classes", headers=_headers("TEACHER"))
    assert response.status_code == 403


@pytest.mark.anyio
async def test_admin_lists_classes(async_client: AsyncClient) -> None:
    admin = SimpleNamespace(id="user-1", role="ADMIN", tenantId=TENANT, isActive=True)
    with patch("app.repositories.user_repository.UserRepository.get_by_id", return_value=admin), \
         patch.object(class_term_service, "list_classes", new=AsyncMock(return_value=[])) as listing:
        response = await async_client.get(
            "/admin/class-management/classes?semester_number=3", headers=_headers("ADMIN")
        )
    assert response.status_code == 200
    assert response.json() == []
    assert listing.await_args.args[0] == TENANT
