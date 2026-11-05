from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from app.services import flagged_review_service as module
from app.services import occurrence_register_service as register_module
from app.services.occurrence_register_service import OccurrenceRegisterService

USER = SimpleNamespace(id="teacher-user-1", role="TEACHER")


def occurrence(locked=False):
    return SimpleNamespace(
        id="occ-1",
        tenantId="tenant-1",
        date=datetime(2026, 11, 5),
        isAttendanceLocked=locked,
        courseSection=SimpleNamespace(subject=SimpleNamespace(name="Data Structures")),
    )


def record(status="FLAGGED", remarks="Face match below threshold."):
    return SimpleNamespace(id="rec-1", studentId="stu-1", status=status, remarks=remarks)


@pytest.fixture
def fake(monkeypatch):
    fake_db = MagicMock()
    fake_db.classoccurrence.find_first = AsyncMock(return_value=occurrence())
    fake_db.attendancerecord.find_first = AsyncMock(return_value=record())
    fake_db.attendancerecord.update_many = AsyncMock(return_value=1)
    fake_db.attendanceauditlog.create = AsyncMock()
    fake_db.student.find_unique = AsyncMock(return_value=SimpleNamespace(userId="student-user-1"))
    monkeypatch.setattr(module, "db", fake_db)
    monkeypatch.setattr(module, "authorize_register_access", AsyncMock())
    monkeypatch.setattr(module, "refresh_streaks", AsyncMock())
    monkeypatch.setattr(module, "create_in_app_notification", AsyncMock())
    monkeypatch.setattr(module, "manager", SimpleNamespace(send_personal_message=AsyncMock()))
    return fake_db


async def decide(decision="APPROVE", note=None):
    return await module.resolve_flagged("tenant-1", USER, "occ-1", "rec-1", decision, note)


async def test_everything_is_looked_up_inside_the_callers_tenant(fake):
    await decide()

    assert fake.classoccurrence.find_first.await_args.kwargs["where"] == {"id": "occ-1", "tenantId": "tenant-1"}
    assert fake.attendancerecord.find_first.await_args.kwargs["where"] == {
        "id": "rec-1",
        "occurrenceId": "occ-1",
        "tenantId": "tenant-1",
    }


async def test_a_teacher_who_does_not_take_the_class_is_refused_and_nothing_changes(fake, monkeypatch):
    monkeypatch.setattr(
        module, "authorize_register_access", AsyncMock(side_effect=HTTPException(status_code=403, detail="no"))
    )

    with pytest.raises(HTTPException) as caught:
        await decide()

    assert caught.value.status_code == 403
    fake.attendancerecord.update_many.assert_not_awaited()
    fake.attendanceauditlog.create.assert_not_awaited()


async def test_approving_counts_the_mark_as_attended_and_is_audited(fake):
    result = await decide("APPROVE")

    assert result == {"record_id": "rec-1", "student_id": "stu-1", "status": "APPROVED"}
    update = fake.attendancerecord.update_many.await_args.kwargs
    assert update["where"] == {"id": "rec-1", "status": "FLAGGED"}
    assert update["data"]["status"] == "APPROVED"
    audit = fake.attendanceauditlog.create.await_args.kwargs["data"]
    assert (audit["previousStatus"], audit["newStatus"]) == ("FLAGGED", "APPROVED")
    assert audit["changedById"] == "teacher-user-1"
    assert audit["reason"] == "Teacher approved the flagged mark"


async def test_rejecting_records_the_student_absent(fake):
    result = await decide("REJECT")

    assert result["status"] == "ABSENT"
    audit = fake.attendanceauditlog.create.await_args.kwargs["data"]
    assert (audit["previousStatus"], audit["newStatus"]) == ("FLAGGED", "ABSENT")
    assert audit["reason"] == "Teacher rejected the flagged mark"


async def test_the_flag_reason_is_kept_and_the_teachers_note_is_added_and_audited(fake):
    await decide("REJECT", note="  Face did not match the ID card  ")

    data = fake.attendancerecord.update_many.await_args.kwargs["data"]
    assert data["remarks"] == "Face match below threshold. Teacher: Face did not match the ID card"
    assert fake.attendanceauditlog.create.await_args.kwargs["data"]["reason"] == "Face did not match the ID card"


async def test_a_mark_that_is_not_flagged_cannot_be_decided(fake):
    fake.attendancerecord.find_first.return_value = record(status="PRESENT")

    with pytest.raises(HTTPException) as caught:
        await decide()

    assert caught.value.status_code == 409
    fake.attendancerecord.update_many.assert_not_awaited()


async def test_a_second_click_that_loses_the_race_is_refused_without_a_second_audit_row(fake):
    fake.attendancerecord.update_many.return_value = 0

    with pytest.raises(HTTPException) as caught:
        await decide()

    assert caught.value.status_code == 409
    fake.attendanceauditlog.create.assert_not_awaited()


async def test_an_unknown_record_or_class_is_not_found(fake):
    fake.attendancerecord.find_first.return_value = None
    with pytest.raises(HTTPException) as caught:
        await decide()
    assert caught.value.status_code == 404

    fake.classoccurrence.find_first.return_value = None
    with pytest.raises(HTTPException) as caught:
        await decide()
    assert caught.value.status_code == 404


async def test_a_locked_register_needs_a_reason(fake):
    fake.classoccurrence.find_first.return_value = occurrence(locked=True)

    for blank in (None, "", "   "):
        with pytest.raises(HTTPException) as caught:
            await decide(note=blank)
        assert caught.value.status_code == 409

    fake.attendancerecord.update_many.assert_not_awaited()


async def test_deciding_on_a_locked_register_refreshes_the_students_streak(fake):
    fake.classoccurrence.find_first.return_value = occurrence(locked=True)

    await decide("APPROVE", note="Checked the CCTV")

    module.refresh_streaks.assert_awaited_once_with(["stu-1"])


async def test_an_open_register_does_not_refresh_streaks(fake):
    await decide()

    module.refresh_streaks.assert_not_awaited()


async def test_the_student_is_told_in_the_inbox_and_live(fake):
    await decide("APPROVE")

    notice = module.create_in_app_notification.await_args.kwargs
    assert notice["user_id"] == "student-user-1"
    assert notice["tenant_id"] == "tenant-1"
    assert "Data Structures" in notice["message"] and "approved" in notice["message"]
    module.manager.send_personal_message.assert_awaited_once_with(
        {"type": "attendance_updated", "occurrence_id": "occ-1"}, "student-user-1"
    )


async def test_the_decision_stands_even_if_the_student_cannot_be_told(fake):
    module.create_in_app_notification.side_effect = RuntimeError("push down")

    result = await decide("APPROVE")

    assert result["status"] == "APPROVED"
    fake.attendanceauditlog.create.assert_awaited_once()


# --- the register response the review section reads --------------------------------------------


def register_row(status, note):
    student = SimpleNamespace(id=f"stu-{status}", firstName="Asha", lastName="Rao", enrollmentNumber="VIT1", user=None)
    rec = SimpleNamespace(
        id=f"rec-{status}", studentId=student.id, status=status, method="AI_BIOMETRIC", faceScore=0.4,
        livenessScore=None, evidencePhotoUrl="registration/x.jpg", remarks="Face match below threshold.",
        studentNote=note, verifiedAt=datetime(2026, 11, 5, 9, 5),
    )
    return student, rec


async def test_the_register_carries_the_record_id_and_the_note_only_for_flagged_marks(monkeypatch):
    flagged_student, flagged_rec = register_row("FLAGGED", "My camera was dark")
    present_student, present_rec = register_row("PRESENT", "stale note")
    occ = SimpleNamespace(
        id="occ-1", tenantId="tenant-1", date=datetime(2026, 11, 5), status="SCHEDULED", isAttendanceLocked=False,
        verificationActive=True, verificationExpires=None, startTime="09:00", endTime="10:00", classroom=None,
        attendanceRecords=[flagged_rec, present_rec],
        courseSection=SimpleNamespace(
            name="CSE-A-1",
            subject=SimpleNamespace(name="Data Structures"),
            enrollments=[SimpleNamespace(student=flagged_student), SimpleNamespace(student=present_student)],
        ),
    )
    fake_db = MagicMock()
    fake_db.classoccurrence.find_first = AsyncMock(return_value=occ)
    monkeypatch.setattr(register_module, "db", fake_db)
    monkeypatch.setattr(register_module, "authorize_register_access", AsyncMock())

    result = await OccurrenceRegisterService.get_occurrence_register("tenant-1", "occ-1", USER)

    by_status = {row["status"]: row for row in result["students"]}
    assert by_status["FLAGGED"]["record_id"] == "rec-FLAGGED"
    assert by_status["FLAGGED"]["student_note"] == "My camera was dark"
    assert by_status["PRESENT"]["record_id"] == "rec-PRESENT"
    assert by_status["PRESENT"]["student_note"] is None
