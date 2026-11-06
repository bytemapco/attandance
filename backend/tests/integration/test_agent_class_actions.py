"""Teacher actions on a class: start, close, mark. Each waits for Confirm and keeps the service's own rules and audit."""
from datetime import datetime

import pytest

from app.core.config import settings
from app.core.datetime_utils import get_ist_today
from app.services.agent.llm import set_llm
from tests.integration.agent_world import World, confirm, propose


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def today_class(seed, world, **extra) -> str:
    today = get_ist_today()
    return seed.insert(
        "class_occurrences", tenant_id=world.tenant_id, course_section_id=world.section_id, faculty_id=world.teacher_id,
        date=datetime(today.year, today.month, today.day), start_time="09:00", end_time="10:00", **extra,
    )


def state(world, occurrence):
    return world.scalar("SELECT verification_active FROM class_occurrences WHERE id = %s", occurrence), \
        world.scalar("SELECT is_attendance_locked FROM class_occurrences WHERE id = %s", occurrence)


def status_of(world, occurrence, student):
    return world.scalar("SELECT status FROM attendance_records WHERE occurrence_id = %s AND student_id = %s", occurrence, student)


class TestStart:
    def test_nothing_opens_until_the_teacher_confirms(self, client, seed, conn):
        world = World(seed, conn)
        occurrence = today_class(seed, world)

        card, _ = propose(client, world, world.teacher, "start_attendance", occurrence_id=occurrence)

        assert card["summary"].startswith("Start attendance for CE-A-1 Maths")
        assert state(world, occurrence)[0] is False
        assert confirm(client, world.teacher, card).status_code == 200
        assert state(world, occurrence)[0] is True

    def test_a_class_taught_by_someone_else_cannot_be_started(self, client, seed, conn):
        world = World(seed, conn)
        theirs = seed.occurrence(world.tenant_id)

        card, told = propose(client, world, world.teacher, "start_attendance", occurrence_id=theirs)

        assert card is None and "not assigned" in told["error"]

    def test_a_class_from_another_institution_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)

        card, told = propose(client, world, world.teacher, "start_attendance", occurrence_id=today_class(seed, other))

        assert card is None and "error" in told

    def test_a_class_on_another_day_cannot_be_started(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.teacher, "start_attendance", occurrence_id=seed.occurrence(world.tenant_id, world.section_id, world.teacher_id))
        assert card is None and "day of the class" in told["error"]

    def test_an_unscheduled_class_can_be_started_from_its_subject(self, client, seed, conn):
        world = World(seed, conn)

        card, _ = propose(client, world, world.teacher, "start_attendance", section_id=world.section_id)
        done = confirm(client, world.teacher, card)

        assert done.status_code == 200
        assert world.scalar("SELECT count(*) FROM class_occurrences WHERE course_section_id = %s AND verification_active", world.section_id) == 1

    def test_the_model_must_give_exactly_one_of_class_or_subject(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.teacher, "start_attendance")
        assert card is None and "Invalid arguments" in told["error"]


class TestStop:
    def test_closing_records_absent_for_everyone_unmarked_and_locks_the_register(self, client, seed, conn):
        world = World(seed, conn)
        occurrence = today_class(seed, world, status="CONDUCTED", verification_active=True)
        seed.record(world.tenant_id, occurrence, world.students[0], "PRESENT")

        card, _ = propose(client, world, world.teacher, "stop_attendance", occurrence_id=occurrence)
        assert card["details"]["will_be_recorded_absent_or_excused"] == 1
        assert state(world, occurrence)[1] is False
        done = confirm(client, world.teacher, card)

        assert done.status_code == 200 and state(world, occurrence)[1] is True
        assert status_of(world, occurrence, world.students[1]) == "ABSENT"
        assert status_of(world, occurrence, world.students[0]) == "PRESENT"

    def test_a_class_already_closed_is_not_offered_again(self, client, seed, conn):
        world = World(seed, conn)
        occurrence = today_class(seed, world, is_attendance_locked=True)
        card, told = propose(client, world, world.teacher, "stop_attendance", occurrence_id=occurrence)
        assert card is None and "already closed" in told["error"]

    def test_someone_elses_class_cannot_be_closed(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.teacher, "stop_attendance", occurrence_id=seed.occurrence(world.tenant_id))
        assert card is None and "not assigned" in told["error"]


class TestMark:
    def change(self, student, status="PRESENT"):
        return {"student_id": student, "status": status}

    def test_the_card_shows_before_and_after_and_confirming_changes_the_mark_with_an_audit_row(self, client, seed, conn):
        world = World(seed, conn)
        occurrence = today_class(seed, world)

        card, _ = propose(client, world, world.teacher, "mark_attendance", occurrence_id=occurrence, changes=[self.change(world.students[0])])

        [row] = card["details"]["table"]["rows"]
        assert row[2:] == ["ABSENT", "PRESENT"]
        assert status_of(world, occurrence, world.students[0]) is None
        assert confirm(client, world.teacher, card).status_code == 200
        assert status_of(world, occurrence, world.students[0]) == "PRESENT"
        assert world.scalar("SELECT count(*) FROM attendance_audit_logs WHERE changed_by_id = %s", world.teacher_user) == 1

    def test_a_student_who_is_not_enrolled_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.teacher, "mark_attendance", occurrence_id=today_class(seed, world), changes=[self.change(world.stranger)])
        assert card is None and "not enrolled" in told["error"]

    def test_a_change_that_changes_nothing_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        occurrence = today_class(seed, world)
        seed.record(world.tenant_id, occurrence, world.students[0], "PRESENT")
        card, told = propose(client, world, world.teacher, "mark_attendance", occurrence_id=occurrence, changes=[self.change(world.students[0])])
        assert card is None and "Nothing would change" in told["error"]

    def test_a_closed_register_needs_a_reason_which_the_teacher_can_add_on_the_card(self, client, seed, conn):
        world = World(seed, conn)
        occurrence = today_class(seed, world, is_attendance_locked=True, status="CONDUCTED")
        args = {"occurrence_id": occurrence, "changes": [self.change(world.students[0])]}

        refused, told = propose(client, world, world.teacher, "mark_attendance", **args)
        card, _ = propose(client, world, world.teacher, "mark_attendance", reason="Was present, scanner failed", **args)

        assert refused is None and "closed" in told["error"]
        assert confirm(client, world.teacher, card).status_code == 200
        assert world.scalar("SELECT reason FROM attendance_audit_logs WHERE changed_by_id = %s", world.teacher_user) == "Was present, scanner failed"

    def test_someone_elses_class_cannot_be_marked(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.teacher, "mark_attendance", occurrence_id=seed.occurrence(world.tenant_id), changes=[self.change(world.students[0])])
        assert card is None and "not assigned" in told["error"]

    def test_an_admin_is_not_offered_the_tool(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "mark_attendance", occurrence_id="x", changes=[self.change("y")])
        assert card is None and "not available" in told["error"]
