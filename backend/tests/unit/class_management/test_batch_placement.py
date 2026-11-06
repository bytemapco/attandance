from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.class_management import batch_placement as placement
from app.services.class_management.common import class_semester


def membership(semester):
    return SimpleNamespace(group=SimpleNamespace(semester=semester))


@pytest.fixture
def fake(monkeypatch):
    db = MagicMock()
    db.studentgroup.find_first = AsyncMock(return_value=SimpleNamespace(id="g-new"))
    db.classmember.find_first = AsyncMock(return_value=None)
    monkeypatch.setattr(placement, "db", db)
    load = AsyncMock(side_effect=lambda tenant_id, class_id: SimpleNamespace(id=class_id))
    monkeypatch.setattr(placement, "get_class_group", load)
    close = AsyncMock()
    monkeypatch.setattr(placement, "close_member", close)
    place = AsyncMock()
    monkeypatch.setattr(placement, "place_students", place)
    return SimpleNamespace(db=db, close=close, place=place)


class TestPlaceInBatchClass:
    async def test_a_new_student_joins_the_active_class_of_the_batch(self, fake):
        assert await placement.place_in_batch_class("t-1", "s-1", "b-1") is True

        where = fake.db.studentgroup.find_first.await_args.kwargs["where"]
        assert where == {"tenantId": "t-1", "batchId": "b-1", "status": "ACTIVE"}
        assert fake.place.await_args.args[2] == ["s-1"]
        fake.close.assert_not_awaited()

    async def test_a_batch_without_a_class_leaves_the_student_unplaced(self, fake):
        fake.db.studentgroup.find_first.return_value = None

        assert await placement.place_in_batch_class("t-1", "s-1", "b-1") is False

        fake.place.assert_not_awaited()

    async def test_a_student_without_a_batch_is_not_placed(self, fake):
        assert await placement.place_in_batch_class("t-1", "s-1", None) is False

        fake.db.studentgroup.find_first.assert_not_awaited()
        fake.place.assert_not_awaited()

    async def test_a_student_already_in_the_class_is_left_alone(self, fake):
        fake.db.classmember.find_first.return_value = SimpleNamespace(groupId="g-new")

        assert await placement.place_in_batch_class("t-1", "s-1", "b-1") is True

        fake.close.assert_not_awaited()
        fake.place.assert_not_awaited()

    async def test_a_changed_batch_leaves_the_old_class_and_joins_the_new_one(self, fake):
        fake.db.classmember.find_first.return_value = SimpleNamespace(groupId="g-old")

        assert await placement.place_in_batch_class("t-1", "s-1", "b-1") is True

        closed_group, student_id, reason = fake.close.await_args.args
        assert (closed_group.id, student_id, reason) == ("g-old", "s-1", placement.BATCH_CHANGED)
        assert fake.place.await_args.args[1].id == "g-new"

    async def test_moving_to_a_batch_without_a_class_still_leaves_the_old_one(self, fake):
        fake.db.classmember.find_first.return_value = SimpleNamespace(groupId="g-old")
        fake.db.studentgroup.find_first.return_value = None

        assert await placement.place_in_batch_class("t-1", "s-1", "b-2") is False

        fake.close.assert_awaited_once()
        fake.place.assert_not_awaited()


class TestClassSemester:
    def test_it_is_the_semester_of_the_class_the_student_is_in(self):
        assert class_semester(SimpleNamespace(classMemberships=[membership(3)])) == 3

    def test_a_student_in_no_class_has_no_semester(self):
        assert class_semester(SimpleNamespace(classMemberships=[])) is None
        assert class_semester(SimpleNamespace(classMemberships=None)) is None
