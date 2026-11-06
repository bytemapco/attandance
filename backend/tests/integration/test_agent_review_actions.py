"""Deciding flagged marks, leave and device requests through the assistant: only the teacher's own, only on Confirm."""
from datetime import datetime

import pytest

from app.core.config import settings
from app.services.agent.llm import set_llm
from tests.integration.agent_world import World, confirm, propose


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def flagged(seed, world, locked=False):
    occurrence = seed.insert(
        "class_occurrences", tenant_id=world.tenant_id, course_section_id=world.section_id, faculty_id=world.teacher_id,
        date=datetime(2026, 11, 2), start_time="09:00", end_time="10:00", is_attendance_locked=locked,
    )
    record = seed.record(world.tenant_id, occurrence, world.students[0], "FLAGGED")
    return occurrence, record


def record_status(world, record):
    return world.scalar("SELECT status FROM attendance_records WHERE id = %s", record)


def leave(seed, world, student):
    return seed.insert("leave_requests", tenant_id=world.tenant_id, student_id=student,
                       start_date=datetime(2026, 11, 3), end_date=datetime(2026, 11, 4), reason="Fever")


def device(seed, world, student):
    return seed.insert("device_change_requests", tenant_id=world.tenant_id, student_id=student, new_device_uuid="new-phone",
                       updated_at=datetime(2026, 11, 3))


class TestFlagged:
    def test_approving_counts_the_student_present_tells_them_and_audits_it(self, client, seed, conn):
        world = World(seed, conn)
        occurrence, record = flagged(seed, world)

        card, _ = propose(client, world, world.teacher, "resolve_flagged_marks", decision="APPROVE",
                          items=[{"record_id": record, "occurrence_id": occurrence}])
        assert record_status(world, record) == "FLAGGED"
        assert confirm(client, world.teacher, card).status_code == 200

        assert record_status(world, record) == "APPROVED"
        assert world.notifications_for(world.student_user(world.students[0])) == 1
        assert world.scalar("SELECT count(*) FROM attendance_audit_logs WHERE attendance_record_id = %s", record) == 1

    def test_rejecting_records_absent(self, client, seed, conn):
        world = World(seed, conn)
        occurrence, record = flagged(seed, world)
        card, _ = propose(client, world, world.teacher, "resolve_flagged_marks", decision="REJECT",
                          items=[{"record_id": record, "occurrence_id": occurrence}])
        confirm(client, world.teacher, card)
        assert record_status(world, record) == "ABSENT"

    def test_a_closed_register_needs_a_note(self, client, seed, conn):
        world = World(seed, conn)
        occurrence, record = flagged(seed, world, locked=True)
        item = [{"record_id": record, "occurrence_id": occurrence}]

        refused, told = propose(client, world, world.teacher, "resolve_flagged_marks", decision="APPROVE", items=item)
        card, _ = propose(client, world, world.teacher, "resolve_flagged_marks", decision="APPROVE", items=item, note="Checked the photo")

        assert refused is None and "closed" in told["error"]
        assert confirm(client, world.teacher, card).status_code == 200

    def test_a_mark_in_someone_elses_class_cannot_be_decided(self, client, seed, conn):
        world = World(seed, conn)
        theirs = seed.occurrence(world.tenant_id)
        record = seed.record(world.tenant_id, theirs, world.students[0], "FLAGGED")
        card, told = propose(client, world, world.teacher, "resolve_flagged_marks", decision="APPROVE",
                             items=[{"record_id": record, "occurrence_id": theirs}])
        assert card is None and "not assigned" in told["error"]
        assert record_status(world, record) == "FLAGGED"

    def test_a_mark_already_decided_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        occurrence, record = flagged(seed, world)
        item = [{"record_id": record, "occurrence_id": occurrence}]
        card, _ = propose(client, world, world.teacher, "resolve_flagged_marks", decision="APPROVE", items=item)
        confirm(client, world.teacher, card)

        again, told = propose(client, world, world.teacher, "resolve_flagged_marks", decision="REJECT", items=item)

        assert again is None and "not flagged" in told["error"]


class TestLeave:
    def test_approving_a_leave_updates_it_with_the_teachers_note(self, client, seed, conn):
        world = World(seed, conn)
        request = leave(seed, world, world.students[0])

        card, _ = propose(client, world, world.teacher, "decide_leaves", leave_ids=[request], decision="APPROVED")
        assert world.scalar("SELECT status FROM leave_requests WHERE id = %s", request) == "PENDING"
        confirm(client, world.teacher, card, {"note": "Get well soon"})

        assert world.scalar("SELECT status FROM leave_requests WHERE id = %s", request) == "APPROVED"
        assert world.scalar("SELECT approver_note FROM leave_requests WHERE id = %s", request) == "Get well soon"
        assert world.scalar("SELECT approved_by FROM leave_requests WHERE id = %s", request) == world.teacher_id

    def test_a_leave_from_a_student_they_do_not_teach_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        request = leave(seed, world, world.stranger)
        card, told = propose(client, world, world.teacher, "decide_leaves", leave_ids=[request], decision="APPROVED")
        assert card is None and "not from your students" in told["error"]

    def test_a_leave_already_decided_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        request = leave(seed, world, world.students[0])
        card, _ = propose(client, world, world.teacher, "decide_leaves", leave_ids=[request], decision="REJECTED")
        confirm(client, world.teacher, card)
        again, told = propose(client, world, world.teacher, "decide_leaves", leave_ids=[request], decision="APPROVED")
        assert again is None and "not pending" in told["error"]

    def test_an_admin_cannot_decide_leaves(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "decide_leaves", leave_ids=["x"], decision="APPROVED")
        assert card is None and "not available" in told["error"]


class TestDeviceChange:
    def test_approving_moves_the_students_account_to_the_new_phone(self, client, seed, conn):
        world = World(seed, conn)
        request = device(seed, world, world.students[0])

        card, _ = propose(client, world, world.teacher, "decide_device_changes", request_ids=[request], decision="APPROVED")
        assert "own new phone" in card["details"]["note"]
        confirm(client, world.teacher, card)

        assert world.scalar("SELECT device_uuid FROM students WHERE id = %s", world.students[0]) == "new-phone"
        assert world.scalar("SELECT status FROM device_change_requests WHERE id = %s", request) == "APPROVED"

    def test_rejecting_leaves_the_phone_unchanged(self, client, seed, conn):
        world = World(seed, conn)
        request = device(seed, world, world.students[0])
        card, _ = propose(client, world, world.teacher, "decide_device_changes", request_ids=[request], decision="REJECTED")
        confirm(client, world.teacher, card)
        assert world.scalar("SELECT device_uuid FROM students WHERE id = %s", world.students[0]) is None

    def test_a_request_from_another_teachers_student_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        request = device(seed, world, world.stranger)
        card, told = propose(client, world, world.teacher, "decide_device_changes", request_ids=[request], decision="APPROVED")
        assert card is None and "not from your students" in told["error"]
