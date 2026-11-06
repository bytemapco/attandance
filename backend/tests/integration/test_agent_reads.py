"""The read tools answer from real data, and stay inside the person's own classes and institution."""
from datetime import datetime

import pytest

from app.core.config import settings
from app.core.datetime_utils import get_ist_today
from app.services.agent.llm import set_llm
from tests.integration.agent_world import ScriptedModel, World, calls, events, says

CHAT, ACCEPT = "/api/v1/agent/chat", "/api/v1/agent/notice/accept"


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def ask(client, world, headers, tool, **args):
    """Has the model call one tool; returns (what the model was told, the events the person saw)."""
    client.post(ACCEPT, headers=world.admin)
    model = ScriptedModel(calls(tool, **args), says("done"))
    set_llm(model)
    shown = events(client.post(CHAT, json={"message": "go"}, headers=headers))
    return model.tool_results[0], shown


def test_students_below_the_minimum_are_listed_with_what_they_need(client, seed, conn):
    world = World(seed, conn)
    world.hold_classes({world.students[0]: 4, world.students[1]: 1})

    told, shown = ask(client, world, world.teacher, "students_below_minimum")

    row = told["below_minimum"]["rows"][0]
    assert told["below_minimum"]["total"] == 1
    assert (row["attended"], row["held"], row["percentage"]) == (1, 4, 25.0)
    assert row["classes_needed"] == 8
    assert any(e.get("kind") == "table" and e["download"].startswith("/reports/shortage/export") for e in shown)


def test_at_risk_students_finds_the_one_below_the_minimum(client, seed, conn):
    world = World(seed, conn)
    world.hold_classes({world.students[0]: 4, world.students[1]: 1})

    told, _ = ask(client, world, world.teacher, "at_risk_students")

    assert [r["percentage"] for r in told["at_risk"]["rows"]] == [25.0]
    assert told["at_risk"]["rows"][0]["reason"] == "below minimum"


def test_a_teacher_sees_no_report_for_a_class_they_do_not_teach(client, seed, conn):
    world, other = World(seed, conn), World(seed, conn)
    other.hold_classes({other.students[0]: 1, other.students[1]: 1})

    told, _ = ask(client, world, world.teacher, "students_below_minimum", class_id=other.group_id)

    assert "error" in told


def test_an_admin_report_needs_a_class_and_cannot_cross_institutions(client, seed, conn):
    world, other = World(seed, conn), World(seed, conn)
    other.hold_classes({other.students[0]: 1, other.students[1]: 1})

    needs_class, _ = ask(client, world, world.admin, "students_below_minimum")
    foreign, _ = ask(client, world, world.admin, "students_below_minimum", class_id=other.group_id)

    assert "Choose a class" in needs_class["error"]
    assert "error" in foreign


def test_my_schedule_lists_todays_class_with_the_headcount(client, seed, conn):
    world = World(seed, conn)
    today = get_ist_today()
    occurrence = seed.insert(
        "class_occurrences", tenant_id=world.tenant_id, course_section_id=world.section_id,
        date=datetime(today.year, today.month, today.day), start_time="09:00", end_time="10:00", faculty_id=world.teacher_id,
    )
    seed.record(world.tenant_id, occurrence, world.students[0], "PRESENT")

    told, _ = ask(client, world, world.teacher, "my_schedule")

    [mine] = [c for c in told["classes"]["rows"] if c["occurrence_id"] == occurrence]
    assert (mine["present"], mine["enrolled"]) == (1, 2)


def test_class_register_lists_who_is_absent(client, seed, conn):
    world = World(seed, conn)
    occurrence = seed.insert(
        "class_occurrences", tenant_id=world.tenant_id, course_section_id=world.section_id, date=datetime(2026, 11, 2),
        start_time="09:00", end_time="10:00", faculty_id=world.teacher_id,
    )
    seed.record(world.tenant_id, occurrence, world.students[0], "PRESENT")

    told, _ = ask(client, world, world.teacher, "class_register", occurrence_id=occurrence)

    assert told["counts"] == {"PRESENT": 1, "ABSENT": 1}
    assert told["absent"]["total"] == 1


def test_a_teacher_cannot_open_another_teachers_register(client, seed, conn):
    world = World(seed, conn)
    foreign = seed.occurrence(world.tenant_id)  # taught by a different teacher

    told, _ = ask(client, world, world.teacher, "class_register", occurrence_id=foreign)

    assert "error" in told


def test_find_students_is_limited_to_the_teachers_own_students_and_the_institution(client, seed, conn):
    world, other = World(seed, conn), World(seed, conn)
    roll = lambda student: world.scalar("SELECT enrollment_number FROM students WHERE id = %s", student)  # noqa: E731

    mine, _ = ask(client, world, world.teacher, "find_students", text=roll(world.students[0]))
    stranger, _ = ask(client, world, world.teacher, "find_students", text=roll(world.stranger))
    admin_sees, _ = ask(client, world, world.admin, "find_students", text=roll(world.stranger))
    foreign, _ = ask(client, world, world.admin, "find_students", text=world.scalar(
        "SELECT enrollment_number FROM students WHERE id = %s", other.students[0]))

    assert len(mine["students"]) == 1 and stranger["students"] == []
    assert len(admin_sees["students"]) == 1 and foreign["students"] == []


def test_a_teacher_sees_the_leave_requests_of_their_students_only(client, seed, conn):
    world = World(seed, conn)
    seed.insert("leave_requests", tenant_id=world.tenant_id, student_id=world.students[0],
                start_date=datetime(2026, 11, 3), end_date=datetime(2026, 11, 4), reason="Fever")
    seed.insert("leave_requests", tenant_id=world.tenant_id, student_id=world.stranger,
                start_date=datetime(2026, 11, 3), end_date=datetime(2026, 11, 4), reason="Trip")

    told, _ = ask(client, world, world.teacher, "pending_approvals")

    assert [r["reason"] for r in told["leaves"]["rows"]] == ["Fever"]


def test_the_admin_backlog_counts_this_institution_only(client, seed, conn):
    world, other = World(seed, conn), World(seed, conn)
    for owner, student in ((world, world.students[0]), (other, other.students[0]), (other, other.students[1])):
        seed.insert("leave_requests", tenant_id=owner.tenant_id, student_id=student,
                    start_date=datetime(2026, 11, 3), end_date=datetime(2026, 11, 4), reason="x")

    told, _ = ask(client, world, world.admin, "approvals_backlog")

    assert told["pending_leaves"] == 1


def test_institution_stats_and_setup_checks_answer_for_an_admin(client, seed, conn):
    world = World(seed, conn)

    stats, _ = ask(client, world, world.admin, "institution_stats")
    setup, _ = ask(client, world, world.admin, "setup_checks")

    assert stats["students"] == 3 and stats["teachers"] == 1
    assert "to_do" in setup and "setup_percent" in setup


def test_how_do_i_answers_from_the_guides_with_a_link(client, seed, conn):
    world = World(seed, conn)

    told, shown = ask(client, world, world.teacher, "how_do_i", question="how do I review flagged scans")

    assert told["guides"][0]["page"] == "/teacher/review"
    assert {"type": "ui", "kind": "link", "label": "Review flagged attendance", "path": "/teacher/review"} in shown
