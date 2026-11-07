"""A person an administrator adds is sent a real invitation: queued by the API, rendered with the real template and
sent by the real worker. Only the SMTP connection is replaced, so a break anywhere else in the chain fails here."""
import os

import pytest
from redis.asyncio import Redis

from app.core.config import settings
from app.services import email_service as email_module
from tests.integration.bulk_import_world import STUDENTS, TEACHERS, reasons
from tests.integration.test_email_delivery import run_worker, run_worker_briefly

ADMIN = "/api/v1/admin"
SUBJECT = "Set up your SAHAJ account"


@pytest.fixture
async def queue():
    """The test Redis, emptied before and after: a job left by another test must not be sent by this worker."""
    url = os.environ.get("TEST_REDIS_URL")
    if not url:
        pytest.skip("TEST_REDIS_URL is not set; the queue needs a Redis server.")
    client = Redis.from_url(url)
    await client.flushdb()
    yield client
    await client.flushdb()
    await client.aclose()


@pytest.fixture
def outbox(monkeypatch):
    """The messages that reached the SMTP call."""
    sent = []

    async def record(message, **options):
        sent.append(message)

    for name, value in (
        ("SMTP_HOST", "smtp.test"), ("SMTP_PORT", 587), ("SMTP_USER", "mailer@example.com"),
        ("SMTP_PASSWORD", "secret"), ("EMAILS_FROM_EMAIL", "mailer@example.com"),
    ):
        monkeypatch.setattr(settings, name, value)
    monkeypatch.setattr(email_module.aiosmtplib, "send", record)
    return sent


def html_of(message) -> str:
    return message.get_payload()[0].get_payload()[1].get_payload(decode=True).decode()


def recipients(outbox) -> list[str]:
    return sorted(message["To"] for message in outbox)


def add_teacher(school, **changes):
    row = school.teacher_row(department_id=school.department, designation_id=school.designation, send_invite=True)
    response = school.client.post(f"{ADMIN}/users/teacher", headers=school.headers, json={**row, **changes})
    return row, response


def add_student(school, **changes):
    row = school.student_row(
        department_id=school.department, batch_id=school.batch, phone="9876543210", gender="M",
        date_of_birth="2005-01-01T00:00:00", send_invite=True,
    )
    response = school.client.post(f"{ADMIN}/users/student", headers=school.headers, json={**row, **changes})
    return row, response


async def test_an_added_teacher_is_sent_their_invitation(school, queue, outbox):
    row, response = add_teacher(school)

    assert response.status_code == 201 and response.json()["invitation_sent"] is True
    assert outbox == [], "the request must only queue the mail"
    await run_worker()

    assert recipients(outbox) == [row["email"]]
    message = outbox[0]
    html = html_of(message)
    assert message["Subject"] == SUBJECT
    assert "as a teacher" in html and "Employee ID" in html and row["employee_id"] in html
    assert "/onboarding?token=" in html and "Temporary password" in html


async def test_an_added_student_is_sent_their_invitation(school, queue, outbox):
    row, response = add_student(school)

    assert response.status_code == 201 and response.json()["invitation_sent"] is True
    await run_worker()

    assert recipients(outbox) == [row["email"]]
    html = html_of(outbox[0])
    assert "as a student" in html and "Enrollment Number" in html and row["enrollment_number"] in html


async def test_nothing_is_queued_or_sent_when_the_admin_switches_the_invitation_off(school, queue, outbox):
    _, teacher = add_teacher(school, send_invite=False)
    _, student = add_student(school, send_invite=False)

    assert teacher.status_code == 201 and student.status_code == 201
    assert teacher.json()["invitation_sent"] is None and student.json()["invitation_sent"] is None
    assert await queue.zcard("arq:queue") == 0
    await run_worker()
    assert outbox == []


async def test_a_bulk_import_sends_one_invitation_per_imported_person_and_none_for_refused_rows(school, queue, outbox):
    teachers = [school.teacher_row(), school.teacher_row(last_name=""), school.teacher_row()]
    students = [school.student_row(), school.student_row(email="not-an-email")]

    imported_teachers = school.run(TEACHERS, teachers, "teachers", send_invite=True)
    imported_students = school.run(STUDENTS, students, "students", send_invite=True)

    assert (imported_teachers["imported_count"], imported_students["imported_count"]) == (2, 1)
    assert set(reasons(imported_teachers)) == {2} and set(reasons(imported_students)) == {2}
    assert imported_teachers["invitations_sent"] == 2 and imported_students["invitations_sent"] == 1
    await run_worker()

    expected = sorted([teachers[0]["email"], teachers[2]["email"], students[0]["email"]])
    assert recipients(outbox) == expected


async def test_a_bulk_import_with_invitations_off_sends_nothing(school, queue, outbox):
    result = school.run(TEACHERS, [school.teacher_row()], "teachers", send_invite=False)

    assert result["imported_count"] == 1 and result["invitations_sent"] == 0
    await run_worker()
    assert outbox == []


async def test_a_mail_server_that_is_down_leaves_the_invitation_queued_for_a_retry(school, queue, outbox, monkeypatch):
    async def refuse(message, **options):
        raise ConnectionRefusedError("smtp is down")

    monkeypatch.setattr(email_module.aiosmtplib, "send", refuse)
    _, response = add_teacher(school)
    assert response.status_code == 201

    await run_worker_briefly()

    assert outbox == []
    assert await queue.zcard("arq:queue") == 1, "the invitation must wait for its retry, not be lost"
