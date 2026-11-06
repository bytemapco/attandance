from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.schemas.class_management import ClassCreate, ClassUpdate
from app.services.class_management import class_service as service
from app.services.class_management.common import class_code

DEPARTMENT = SimpleNamespace(id="dep-1", code="CE")
BATCH = SimpleNamespace(id="b-1", code="A-1")


def payload(**overrides):
    return ClassCreate(**{"department_id": "dep-1", "batch_id": "b-1", "semester_number": 3, **overrides})


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    fake.department.find_first = AsyncMock(return_value=DEPARTMENT)
    fake.studentgroup.find_first = AsyncMock(return_value=None)
    fake.studentgroup.create = AsyncMock(return_value=SimpleNamespace(id="g-1"))
    fake.studentgroup.update = AsyncMock(return_value=SimpleNamespace(id="g-1"))
    fake.studentgroup.delete = AsyncMock()
    fake.classmember.count = AsyncMock(return_value=0)
    monkeypatch.setattr(service, "db", fake)
    monkeypatch.setattr(service, "resolve_assignable_batch", AsyncMock(return_value=BATCH))
    monkeypatch.setattr(service, "require_students_in_tenant", AsyncMock())
    monkeypatch.setattr(service, "get_class_group", AsyncMock(return_value=SimpleNamespace(id="g-1")))
    monkeypatch.setattr(service, "build_detail", lambda g: g)
    monkeypatch.setattr(service, "place_students", AsyncMock())
    return fake


class TestValidation:
    @pytest.mark.parametrize("semester", [0, 9, -1])
    def test_semester_must_be_between_one_and_eight(self, semester):
        with pytest.raises(ValidationError):
            payload(semester_number=semester)
        with pytest.raises(ValidationError):
            ClassUpdate(semester_number=semester)

    @pytest.mark.parametrize("semester", [1, 8])
    def test_the_edges_are_allowed(self, semester):
        assert payload(semester_number=semester).semester_number == semester

    def test_unknown_fields_are_rejected(self):
        with pytest.raises(ValidationError):
            ClassCreate(department_id="d", batch_id="b", semester_number=1, academic_year_id="x")

    def test_a_batch_that_already_has_the_department_prefix_is_not_prefixed_twice(self):
        assert class_code("CE", "CE-A-1") == "CE-A-1"
        assert class_code("CE", "ce-A-1") == "ce-A-1"
        assert class_code("CE", "A-1") == "CE-A-1"


class TestCreate:
    async def test_a_department_from_another_tenant_is_a_404(self, fake_db):
        fake_db.department.find_first.return_value = None

        with pytest.raises(HTTPException) as caught:
            await service.create_class("tenant-1", payload())

        assert caught.value.status_code == 404
        assert fake_db.department.find_first.await_args.kwargs["where"] == {"id": "dep-1", "tenantId": "tenant-1"}
        fake_db.studentgroup.create.assert_not_awaited()

    async def test_a_new_class_is_created_with_its_semester(self, fake_db):
        await service.create_class("tenant-1", payload())

        data = fake_db.studentgroup.create.await_args.kwargs["data"]
        assert data["tenantId"] == "tenant-1" and data["batch"] == "A-1" and data["semester"] == 3

    async def test_a_duplicate_active_class_is_a_409(self, fake_db):
        fake_db.studentgroup.find_first.return_value = SimpleNamespace(id="g-0", status="ACTIVE")

        with pytest.raises(HTTPException) as caught:
            await service.create_class("tenant-1", payload())

        assert caught.value.status_code == 409
        fake_db.studentgroup.create.assert_not_awaited()

    async def test_an_archived_class_is_reopened_instead_of_duplicated(self, fake_db):
        fake_db.studentgroup.find_first.return_value = SimpleNamespace(id="g-0", status="ARCHIVED")

        await service.create_class("tenant-1", payload())

        fake_db.studentgroup.create.assert_not_awaited()
        assert fake_db.studentgroup.update.await_args.kwargs["data"]["status"] == "ACTIVE"

    async def test_a_student_already_in_another_class_blocks_creation(self, fake_db):
        fake_db.classmember.count.return_value = 2

        with pytest.raises(HTTPException) as caught:
            await service.create_class("tenant-1", payload(student_ids=["s1", "s2"]))

        assert caught.value.status_code == 409
        fake_db.studentgroup.create.assert_not_awaited()

    async def test_a_failure_while_adding_students_removes_the_new_class(self, fake_db):
        service.place_students.side_effect = RuntimeError("boom")

        with pytest.raises(RuntimeError):
            await service.create_class("tenant-1", payload(student_ids=["s1"]))

        fake_db.studentgroup.delete.assert_awaited_once_with(where={"id": "g-1"})

    async def test_a_failure_does_not_delete_a_class_that_was_only_reopened(self, fake_db):
        fake_db.studentgroup.find_first.return_value = SimpleNamespace(id="g-0", status="ARCHIVED")
        service.place_students.side_effect = RuntimeError("boom")

        with pytest.raises(RuntimeError):
            await service.create_class("tenant-1", payload(student_ids=["s1"]))

        fake_db.studentgroup.delete.assert_not_awaited()

    async def test_a_batch_error_maps_to_a_404_or_400(self, fake_db):
        service.resolve_assignable_batch.side_effect = ValueError("Batch not found")
        with pytest.raises(HTTPException) as caught:
            await service.create_class("tenant-1", payload())
        assert caught.value.status_code == 404

        service.resolve_assignable_batch.side_effect = ValueError("Batch belongs to another department")
        with pytest.raises(HTTPException) as caught:
            await service.create_class("tenant-1", payload())
        assert caught.value.status_code == 400


async def test_editing_the_semester_updates_only_that_field(fake_db):
    await service.update_class("tenant-1", "g-1", ClassUpdate(semester_number=5))

    fake_db.studentgroup.update.assert_awaited_once_with(where={"id": "g-1"}, data={"semester": 5})


async def test_listing_always_filters_by_tenant_and_searches_by_code(fake_db, monkeypatch):
    groups = [SimpleNamespace(code="CE-A-1"), SimpleNamespace(code="ME-B-2")]
    fake_db.studentgroup.find_many = AsyncMock(return_value=groups)
    monkeypatch.setattr(service, "build_summary", lambda g: g)

    result = await service.list_classes("tenant-1", department_id="dep-1", semester_number=3, search=" ce ")

    where = fake_db.studentgroup.find_many.await_args.kwargs["where"]
    assert where == {"tenantId": "tenant-1", "departmentId": "dep-1", "semester": 3}
    assert [g.code for g in result] == ["CE-A-1"]
