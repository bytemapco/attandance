from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services.agent.tools import messaging
from app.services.agent.tools.messaging import RECIPIENT_CAP, SendMessageArgs
from app.services.agent.types import ADMIN, TEACHER, Principal


def person(index):
    return SimpleNamespace(
        userId=f"u{index}", firstName=f"First{index}", lastName="Last", user=SimpleNamespace(email=f"{index}@x.test"), id=f"s{index}"
    )


def teacher_principal():
    return Principal(user=SimpleNamespace(id="ut"), role=TEACHER, tenant_id="tenant-1", teacher=SimpleNamespace(id="teacher-1"))


def admin_principal():
    return Principal(user=SimpleNamespace(id="ua"), role=ADMIN, tenant_id="tenant-1")


def args(**extra):
    return SendMessageArgs(**{"audience": "students", "ids": ["s0"], "title": "Hi", "message": "Hello", **extra})


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    fake.student.find_many = AsyncMock(return_value=[person(0), person(1)])
    fake.teacher.find_many = AsyncMock(return_value=[person(5)])
    fake.coursesection.find_first = AsyncMock(return_value=SimpleNamespace(id="sec"))
    fake.courseenrollment.find_many = AsyncMock(return_value=[SimpleNamespace(student=person(0))])
    fake.classmember.find_many = AsyncMock(return_value=[SimpleNamespace(student=person(0))])
    monkeypatch.setattr(messaging, "db", fake)
    return fake


async def refused(call):
    with pytest.raises(HTTPException) as caught:
        await call
    assert caught.value.status_code == 400
    return caught.value.detail


class TestWhoMayBeMessaged:
    async def test_a_teachers_student_audience_is_limited_to_students_they_teach(self, fake_db):
        await messaging.recipients(teacher_principal(), args())
        where = fake_db.student.find_many.call_args.kwargs["where"]
        assert "courseEnrollments" in where and where["tenantId"] == "tenant-1"

    async def test_an_admins_student_audience_is_not_limited_to_one_teacher(self, fake_db):
        await messaging.recipients(admin_principal(), args())
        assert "courseEnrollments" not in fake_db.student.find_many.call_args.kwargs["where"]

    @pytest.mark.parametrize("audience", ["teachers", "all_teachers", "class"])
    async def test_a_teacher_cannot_message_staff_or_a_whole_class(self, fake_db, audience):
        await refused(messaging.recipients(teacher_principal(), args(audience=audience)))

    async def test_a_teachers_subject_must_be_one_they_are_assigned_to(self, fake_db):
        fake_db.coursesection.find_first.return_value = None
        await refused(messaging.recipients(teacher_principal(), args(audience="section", ids=["sec"])))
        assert "faculties" in fake_db.coursesection.find_first.call_args.kwargs["where"]

    async def test_an_admin_subject_is_not_limited_to_one_teacher(self, fake_db):
        await messaging.recipients(admin_principal(), args(audience="section", ids=["sec"]))
        assert "faculties" not in fake_db.coursesection.find_first.call_args.kwargs["where"]

    async def test_a_subject_or_class_needs_exactly_one_id(self, fake_db):
        await refused(messaging.recipients(admin_principal(), args(audience="class", ids=["a", "b"])))

    async def test_an_admin_can_message_a_class_and_all_teachers(self, fake_db):
        assert len(await messaging.recipients(admin_principal(), args(audience="class", ids=["g1"]))) == 1
        assert (await messaging.recipients(admin_principal(), args(audience="all_teachers", ids=[])))[0].role == "TEACHER"

    async def test_all_teachers_does_not_filter_by_id(self, fake_db):
        await messaging.recipients(admin_principal(), args(audience="all_teachers", ids=[]))
        assert "id" not in fake_db.teacher.find_many.call_args.kwargs["where"]

    async def test_nobody_matching_is_refused(self, fake_db):
        fake_db.student.find_many.return_value = []
        await refused(messaging.recipients(admin_principal(), args()))

    async def test_too_large_an_audience_is_refused(self, fake_db):
        fake_db.student.find_many.return_value = [person(i) for i in range(RECIPIENT_CAP + 1)]
        await refused(messaging.recipients(admin_principal(), args()))


class TestPreview:
    async def test_it_names_a_few_people_and_counts_the_rest(self, fake_db):
        fake_db.student.find_many.return_value = [person(i) for i in range(12)]
        preview = await messaging.preview_message(admin_principal(), args())
        assert preview.summary == 'Send "Hi" to 12 people'
        assert preview.details["recipients"][-1] == "and 4 more" and preview.details["count"] == 12

    async def test_one_person_is_not_called_people(self, fake_db):
        fake_db.student.find_many.return_value = [person(0)]
        assert (await messaging.preview_message(admin_principal(), args())).summary == 'Send "Hi" to 1 person'


class TestSend:
    async def test_each_recipient_gets_an_in_app_notification_from_the_right_institution(self, fake_db, monkeypatch):
        notify = AsyncMock()
        monkeypatch.setattr(messaging, "create_in_app_notification", notify)

        result = await messaging.send_message(admin_principal(), args())

        assert result.data["sent"] == 2 and notify.await_count == 2
        first = notify.call_args_list[0].kwargs
        assert (first["user_id"], first["tenant_id"], first["category"]) == ("u0", "tenant-1", "message")
        assert "role" not in first

    async def test_the_model_cannot_ask_for_an_e_mail(self):
        assert "also_email" not in SendMessageArgs.model_fields
