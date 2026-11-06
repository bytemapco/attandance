from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services import flagged_review_service as module
from app.services.flagged_review_service import _remarks, resolve_flagged

TEACHER = SimpleNamespace(id="user-t", role="TEACHER")


def occurrence(locked=False):
    return SimpleNamespace(
        id="occ-1",
        tenantId="tenant-1",
        isAttendanceLocked=locked,
        date=SimpleNamespace(date=lambda: __import__("datetime").date(2026, 11, 2)),
        courseSection=SimpleNamespace(subject=SimpleNamespace(name="Maths")),
    )


@pytest.fixture
def fake_db(monkeypatch):
    fake = MagicMock()
    fake.classoccurrence.find_first = AsyncMock(return_value=occurrence())
    fake.attendancerecord.find_first = AsyncMock(
        return_value=SimpleNamespace(id="rec-1", studentId="stu-1", status="FLAGGED", remarks="Face match below threshold.")
    )
    fake.attendancerecord.update_many = AsyncMock(return_value=1)
    fake.attendanceauditlog.create = AsyncMock()
    fake.student.find_unique = AsyncMock(return_value=SimpleNamespace(userId="user-s"))
    monkeypatch.setattr(module, "db", fake)
    monkeypatch.setattr(module, "authorize_register_access", AsyncMock())
    monkeypatch.setattr(module, "refresh_streaks", AsyncMock())
    monkeypatch.setattr(module, "create_in_app_notification", AsyncMock())
    monkeypatch.setattr(module, "manager", SimpleNamespace(send_personal_message=AsyncMock()))
    return fake


async def decide(decision="APPROVE", note=None):
    return await resolve_flagged("tenant-1", TEACHER, "occ-1", "rec-1", decision, note)


def test_the_original_flag_reason_is_kept_and_the_teachers_note_follows():
    assert _remarks("Face match below threshold.", "Known student") == "Face match below threshold. Teacher: Known student"
    assert _remarks(None, "Known student") == "Teacher: Known student"
    assert _remarks("Reason", None) == "Reason"
    assert _remarks(None, None) is None


async def test_approving_marks_the_student_approved_and_audits_it(fake_db):
    result = await decide("APPROVE")

    assert result == {"record_id": "rec-1", "student_id": "stu-1", "status": "APPROVED"}
    audit = fake_db.attendanceauditlog.create.await_args.kwargs["data"]
    assert audit["previousStatus"] == "FLAGGED" and audit["newStatus"] == "APPROVED"
    assert audit["changedById"] == "user-t" and audit["reason"] == "Teacher approved the flagged mark"


async def test_rejecting_records_the_student_absent(fake_db):
    result = await decide("REJECT", note="Photo was of someone else")

    assert result["status"] == "ABSENT"
    assert fake_db.attendanceauditlog.create.await_args.kwargs["data"]["reason"] == "Photo was of someone else"


async def test_the_record_is_looked_up_inside_the_tenant_and_occurrence(fake_db):
    await decide()

    where = fake_db.attendancerecord.find_first.await_args.kwargs["where"]
    assert where == {"id": "rec-1", "occurrenceId": "occ-1", "tenantId": "tenant-1"}


async def test_an_unknown_class_is_a_404(fake_db):
    fake_db.classoccurrence.find_first.return_value = None
    with pytest.raises(HTTPException) as caught:
        await decide()
    assert caught.value.status_code == 404


async def test_an_unknown_record_is_a_404(fake_db):
    fake_db.attendancerecord.find_first.return_value = None
    with pytest.raises(HTTPException) as caught:
        await decide()
    assert caught.value.status_code == 404


async def test_a_mark_that_is_no_longer_flagged_cannot_be_decided_again(fake_db):
    fake_db.attendancerecord.find_first.return_value = SimpleNamespace(
        id="rec-1", studentId="stu-1", status="APPROVED", remarks=None
    )
    with pytest.raises(HTTPException) as caught:
        await decide()
    assert caught.value.status_code == 409
    fake_db.attendancerecord.update_many.assert_not_awaited()


async def test_two_quick_decisions_cannot_both_win(fake_db):
    fake_db.attendancerecord.update_many.return_value = 0

    with pytest.raises(HTTPException) as caught:
        await decide()

    assert caught.value.status_code == 409
    fake_db.attendanceauditlog.create.assert_not_awaited()


async def test_the_update_only_touches_a_record_that_is_still_flagged(fake_db):
    await decide()
    assert fake_db.attendancerecord.update_many.await_args.kwargs["where"] == {"id": "rec-1", "status": "FLAGGED"}


async def test_a_locked_register_needs_a_reason(fake_db):
    fake_db.classoccurrence.find_first.return_value = occurrence(locked=True)
    for blank in (None, "", "  "):
        with pytest.raises(HTTPException) as caught:
            await decide(note=blank)
        assert caught.value.status_code == 409


async def test_a_decision_on_a_locked_register_refreshes_the_streak(fake_db):
    fake_db.classoccurrence.find_first.return_value = occurrence(locked=True)

    await decide(note="Verified in person")

    module.refresh_streaks.assert_awaited_once_with(["stu-1"])


async def test_an_open_register_does_not_refresh_streaks_yet(fake_db):
    await decide()
    module.refresh_streaks.assert_not_awaited()


async def test_the_decision_stands_when_the_student_cannot_be_notified(fake_db):
    module.create_in_app_notification.side_effect = RuntimeError("smtp down")

    result = await decide()

    assert result["status"] == "APPROVED"


async def test_teacher_authorization_is_checked_before_anything_changes(fake_db):
    module.authorize_register_access.side_effect = HTTPException(status_code=403, detail="no")

    with pytest.raises(HTTPException) as caught:
        await decide()

    assert caught.value.status_code == 403
    fake_db.attendancerecord.update_many.assert_not_awaited()
