from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.schemas.batch import BatchCreate
from app.services import batch_service

TENANT = "tenant-a"
DEPT = "dept-cse"


@pytest.fixture
def fake_db(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    fake = MagicMock()
    fake.department.find_first = AsyncMock(return_value=SimpleNamespace(id=DEPT, code="CE"))
    fake.batch.find_first = AsyncMock(return_value=None)
    fake.batch.find_many = AsyncMock(return_value=[])
    fake.batch.create = AsyncMock(return_value=SimpleNamespace(id="b-1"))
    fake.batch.create_many = AsyncMock(return_value=0)
    fake.batch.update = AsyncMock()
    fake.batch.delete = AsyncMock()
    fake.query_raw = AsyncMock(return_value=[])
    monkeypatch.setattr(batch_service, "db", fake)
    return fake


def _row(number: int, section: str = "A", students: int = 0, classes: int = 0, status: str = "ACTIVE") -> dict:
    stamp = datetime(2026, 11, 1)
    return {
        "id": f"b-{section}{number}",
        "departmentId": DEPT,
        "section": section,
        "number": number,
        "code": f"CE-{section}-{number}",
        "status": status,
        "createdAt": stamp,
        "updatedAt": stamp,
        "studentCount": students,
        "classCount": classes,
    }


def _batch(code: str = "CE-A-1", status: str = "ACTIVE", dept: str = DEPT, batch_id: str = "b-1"):
    _, section, number = code.split("-")
    return SimpleNamespace(
        id=batch_id, code=code, section=section, number=int(number), departmentId=dept, status=status
    )


def test_batch_code_is_department_section_number() -> None:
    assert batch_service.build_batch_code("CE", "A", 1) == "CE-A-1"
    assert batch_service.build_batch_code("CSE", "B", 12) == "CSE-B-12"


def test_section_must_be_a_single_uppercase_letter() -> None:
    with pytest.raises(ValidationError):
        BatchCreate(section="AB", number=1)
    with pytest.raises(ValidationError):
        BatchCreate(section="a", number=1)


@pytest.mark.anyio
async def test_create_batch_rejects_an_existing_code(fake_db: MagicMock) -> None:
    fake_db.batch.find_first.return_value = _batch()
    with pytest.raises(HTTPException) as err:
        await batch_service.create_batch(TENANT, DEPT, BatchCreate(section="A", number=1))
    assert err.value.status_code == 409
    fake_db.batch.create.assert_not_awaited()


@pytest.mark.anyio
async def test_create_batch_scopes_lookups_and_writes_to_the_tenant(fake_db: MagicMock) -> None:
    fake_db.query_raw.return_value = [_row(1)]
    response = await batch_service.create_batch(TENANT, DEPT, BatchCreate(section="A", number=1))
    assert response.code == "CE-A-1"
    assert fake_db.department.find_first.await_args.kwargs["where"] == {"id": DEPT, "tenantId": TENANT}
    assert fake_db.batch.find_first.await_args.kwargs["where"]["tenantId"] == TENANT
    assert fake_db.batch.create.await_args.kwargs["data"]["tenantId"] == TENANT


@pytest.mark.anyio
async def test_create_without_number_takes_the_next_free_number(fake_db: MagicMock) -> None:
    fake_db.batch.find_first = AsyncMock(side_effect=[_batch("CE-A-2"), None])
    fake_db.query_raw.return_value = [_row(3)]
    response = await batch_service.create_batch(TENANT, DEPT, BatchCreate(section="A"))
    assert response.code == "CE-A-3"
    assert fake_db.batch.create.await_args.kwargs["data"]["number"] == 3


@pytest.mark.anyio
async def test_create_without_number_starts_at_one_in_an_empty_section(fake_db: MagicMock) -> None:
    fake_db.batch.find_first = AsyncMock(side_effect=[None, None])
    fake_db.query_raw.return_value = [_row(1)]
    await batch_service.create_batch(TENANT, DEPT, BatchCreate(section="A"))
    assert fake_db.batch.create.await_args.kwargs["data"]["code"] == "CE-A-1"


@pytest.mark.anyio
async def test_create_refuses_once_a_section_reaches_99(fake_db: MagicMock) -> None:
    fake_db.batch.find_first = AsyncMock(side_effect=[_batch("CE-A-99")])
    with pytest.raises(HTTPException) as err:
        await batch_service.create_batch(TENANT, DEPT, BatchCreate(section="A"))
    assert err.value.status_code == 400
    fake_db.batch.create.assert_not_awaited()


@pytest.mark.anyio
async def test_list_batches_is_scoped_to_tenant_and_department(fake_db: MagicMock) -> None:
    fake_db.query_raw.return_value = [_row(1), _row(2, students=18, classes=1)]
    result = await batch_service.list_batches(TENANT, DEPT)
    assert [b.code for b in result] == ["CE-A-1", "CE-A-2"]
    assert result[1].student_count == 18 and result[1].class_count == 1
    args = fake_db.query_raw.await_args.args
    assert args[1:] == (TENANT, DEPT)


@pytest.mark.anyio
async def test_delete_refuses_a_batch_with_students_or_classes(fake_db: MagicMock) -> None:
    fake_db.query_raw.return_value = [_row(1, students=3)]
    with pytest.raises(HTTPException) as err:
        await batch_service.delete_batch(TENANT, "b-A1")
    assert err.value.status_code == 409
    fake_db.batch.delete.assert_not_awaited()


@pytest.mark.anyio
async def test_delete_removes_an_empty_batch(fake_db: MagicMock) -> None:
    fake_db.query_raw.return_value = [_row(1)]
    await batch_service.delete_batch(TENANT, "b-A1")
    assert fake_db.batch.delete.await_args.kwargs["where"] == {"id": "b-A1"}


@pytest.mark.anyio
async def test_unknown_batch_in_another_tenant_is_not_found(fake_db: MagicMock) -> None:
    fake_db.query_raw.return_value = []
    with pytest.raises(HTTPException) as err:
        await batch_service.set_batch_status("tenant-b", "b-A1", "ARCHIVED")
    assert err.value.status_code == 404


@pytest.mark.anyio
async def test_assignment_requires_same_department_and_active_batch(fake_db: MagicMock) -> None:
    fake_db.batch.find_first.return_value = _batch(dept="dept-other")
    with pytest.raises(ValueError, match="does not belong"):
        await batch_service.resolve_assignable_batch(TENANT, "b-1", DEPT)

    fake_db.batch.find_first.return_value = _batch(status="ARCHIVED")
    with pytest.raises(ValueError, match="archived"):
        await batch_service.resolve_assignable_batch(TENANT, "b-1", DEPT)

    fake_db.batch.find_first.return_value = None
    with pytest.raises(ValueError, match="not found"):
        await batch_service.resolve_assignable_batch(TENANT, "b-1", DEPT)

    fake_db.batch.find_first.return_value = _batch()
    assert (await batch_service.resolve_assignable_batch(TENANT, "b-1", DEPT)).code == "CE-A-1"


@pytest.mark.anyio
async def test_no_batch_id_resolves_to_none(fake_db: MagicMock) -> None:
    assert await batch_service.resolve_assignable_batch(TENANT, None, DEPT) is None
    fake_db.batch.find_first.assert_not_awaited()
