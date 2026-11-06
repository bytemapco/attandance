from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.schemas.class_management import ClassMemberMove, ClassMemberRemove
from app.services.class_management import class_member_service as members
from app.services.class_management import enrollment_sync as sync


def group(group_id="g-1", batch_id="b-1", sections=("sec-1", "sec-2"), member_ids=()):
    return SimpleNamespace(
        id=group_id,
        batchId=batch_id,
        batch="A-1",
        courseSections=[SimpleNamespace(id=s) for s in sections],
        members=[SimpleNamespace(studentId=m) for m in member_ids],
    )


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    fake.classmember.find_many = AsyncMock(return_value=[])
    fake.classmember.find_unique = AsyncMock(return_value=None)
    fake.classmember.create = AsyncMock()
    fake.classmember.update = AsyncMock()
    fake.student.count = AsyncMock(return_value=0)
    fake.courseenrollment.find_unique = AsyncMock(return_value=None)
    fake.courseenrollment.create = AsyncMock()
    fake.courseenrollment.update = AsyncMock()
    fake.courseenrollment.update_many = AsyncMock()
    monkeypatch.setattr(members, "db", fake)
    monkeypatch.setattr(sync, "db", fake)
    return fake


class TestPlaceStudents:
    async def test_new_members_join_the_class_and_every_subject(self, fake_db):
        added = await members.place_students("tenant-1", group(), ["s1", "s2"])

        assert added == 2
        assert fake_db.classmember.create.await_count == 2
        enrolled = [c.kwargs["data"] for c in fake_db.courseenrollment.create.await_args_list]
        assert len(enrolled) == 4  # 2 students x 2 subjects
        assert {e["source"] for e in enrolled} == {"CLASS"}

    async def test_the_member_row_carries_the_tenant(self, fake_db):
        await members.place_students("tenant-1", group(), ["s1"])
        assert fake_db.classmember.create.await_args.kwargs["data"]["tenantId"] == "tenant-1"

    async def test_a_student_active_in_another_class_is_refused(self, fake_db):
        fake_db.classmember.find_many.return_value = [SimpleNamespace(groupId="other", studentId="s1")]

        with pytest.raises(HTTPException) as caught:
            await members.place_students("tenant-1", group(), ["s1"])

        assert caught.value.status_code == 409
        fake_db.classmember.create.assert_not_awaited()
        fake_db.courseenrollment.create.assert_not_awaited()

    async def test_a_student_already_in_this_class_is_not_enrolled_twice(self, fake_db):
        fake_db.classmember.find_many.return_value = [SimpleNamespace(groupId="g-1", studentId="s1")]

        added = await members.place_students("tenant-1", group(), ["s1", "s2"])

        assert added == 1

    async def test_duplicate_ids_in_the_request_count_once(self, fake_db):
        assert await members.place_students("tenant-1", group(), ["s1", "s1"]) == 1

    async def test_students_outside_the_classes_batch_are_refused(self, fake_db):
        fake_db.student.count.return_value = 1

        with pytest.raises(HTTPException) as caught:
            await members.place_students("tenant-1", group(), ["s1"])

        assert caught.value.status_code == 400

    async def test_a_returning_member_is_reactivated_not_duplicated(self, fake_db):
        fake_db.classmember.find_unique.return_value = SimpleNamespace(status="TRANSFERRED")

        await members.place_students("tenant-1", group(), ["s1"])

        fake_db.classmember.create.assert_not_awaited()
        assert fake_db.classmember.update.await_args.kwargs["data"]["status"] == "ACTIVE"


class TestEnrollmentSync:
    async def test_an_existing_active_enrolment_is_left_alone(self, fake_db):
        fake_db.courseenrollment.find_unique.return_value = SimpleNamespace(endedAt=None)

        assert await sync.enroll_students(["sec-1"], ["s1"]) == 0
        fake_db.courseenrollment.create.assert_not_awaited()
        fake_db.courseenrollment.update.assert_not_awaited()

    async def test_an_ended_enrolment_is_reopened(self, fake_db):
        fake_db.courseenrollment.find_unique.return_value = SimpleNamespace(endedAt="2026-10-01")

        assert await sync.enroll_students(["sec-1"], ["s1"]) == 1
        data = fake_db.courseenrollment.update.await_args.kwargs["data"]
        assert data["endedAt"] is None and data["status"] == "ACTIVE"

    async def test_leaving_a_class_ends_only_class_sourced_enrolments(self, fake_db):
        await sync.end_class_enrollments(["sec-1"], ["s1"])

        where = fake_db.courseenrollment.update_many.await_args.kwargs["where"]
        assert where["source"] == "CLASS" and where["endedAt"] is None
        assert fake_db.courseenrollment.update_many.await_args.kwargs["data"]["status"] == "DROPPED"

    async def test_nothing_is_ended_without_sections_or_students(self, fake_db):
        await sync.end_class_enrollments([], ["s1"])
        await sync.end_class_enrollments(["sec-1"], [])
        fake_db.courseenrollment.update_many.assert_not_awaited()


class TestMoveAndRemove:
    @pytest.fixture
    def classes(self, monkeypatch):
        source = group("g-1", member_ids=["s1"])
        target = group("g-2")

        async def get_group(tenant_id, class_id):
            return {"g-1": source, "g-2": target}[class_id]

        monkeypatch.setattr(members, "get_class_group", get_group)
        monkeypatch.setattr(members, "build_detail", lambda g: g.id)
        return SimpleNamespace(source=source, target=target)

    async def test_moving_to_the_same_class_is_a_400(self, fake_db, classes):
        with pytest.raises(HTTPException) as caught:
            await members.move_member("tenant-1", "g-1", "s1", ClassMemberMove(target_class_id="g-1", reason="same"))
        assert caught.value.status_code == 400

    async def test_moving_closes_the_old_membership_then_places_in_the_new_class(self, fake_db, classes):
        await members.move_member("tenant-1", "g-1", "s1", ClassMemberMove(target_class_id="g-2", reason="Shifted"))

        closed = fake_db.classmember.update.await_args_list[0].kwargs
        assert closed["data"]["status"] == "TRANSFERRED" and closed["data"]["reason"] == "Shifted"
        assert fake_db.classmember.create.await_args.kwargs["data"]["groupId"] == "g-2"

    async def test_only_an_active_member_can_be_moved_or_removed(self, fake_db, classes):
        with pytest.raises(HTTPException) as caught:
            await members.remove_member("tenant-1", "g-1", "stranger", ClassMemberRemove(reason="left"))
        assert caught.value.status_code == 404

    async def test_removing_keeps_the_row_as_history_and_ends_class_enrolments(self, fake_db, classes):
        await members.remove_member("tenant-1", "g-1", "s1", ClassMemberRemove(reason="Dropped out"))

        assert fake_db.classmember.update.await_args.kwargs["data"]["status"] == "TRANSFERRED"
        assert fake_db.courseenrollment.update_many.await_args.kwargs["where"]["source"] == "CLASS"
