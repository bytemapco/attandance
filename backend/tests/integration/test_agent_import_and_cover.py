"""Spreadsheet import, covering an absent teacher, and the proxy-attendance watch."""
import uuid
from datetime import datetime, timedelta

import pytest

from app.core.config import settings
from app.core.datetime_utils import get_ist_today
from app.services.agent.llm import set_llm
from tests.integration.agent_world import ACCEPT, CHAT, ScriptedModel, World, calls, confirm, events, propose, says


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def ask(client, world, headers, tool, **args):
    client.post(ACCEPT, headers=world.admin)
    model = ScriptedModel(calls(tool, **args), says("done"))
    set_llm(model)
    events(client.post(CHAT, json={"message": "go"}, headers=headers))
    return model.tool_results[0]


def seats(conn, world, count=100):
    with conn.cursor() as cursor:
        cursor.execute("UPDATE tenants SET license_count = %s WHERE id = %s", (count, world.tenant_id))


def dept_code(world):
    return world.scalar("SELECT code FROM departments WHERE id = %s", world.department_id)


def mail(world, n):
    """Unique per institution: the users table is shared by every test."""
    return f"new{n}-{world.tenant_id[:10]}@example.com"


def student(n, world, **extra):
    return {"email": mail(world, n), "enrollment_number": f"ENR{n:04d}", "first_name": f"New{n}", "last_name": "Student",
            "department": dept_code(world), **extra}


class TestImportStudents:
    def test_valid_rows_are_imported_on_confirm_with_the_department_found_by_code(self, client, seed, conn):
        world = World(seed, conn)
        seats(conn, world)
        before = world.scalar("SELECT count(*) FROM students WHERE tenant_id = %s", world.tenant_id)

        card, _ = propose(client, world, world.admin, "import_students", rows=[student(1, world), student(2, world)])
        assert card["summary"] == "Import 2 students" and "invitation" in card["details"]["note"]
        assert world.scalar("SELECT count(*) FROM students WHERE tenant_id = %s", world.tenant_id) == before
        done = confirm(client, world.admin, card)

        assert done.status_code == 200 and "Imported 2" in done.json()["message"]
        assert world.scalar("SELECT count(*) FROM students WHERE tenant_id = %s", world.tenant_id) == before + 2

    def test_bad_rows_are_listed_and_skipped_while_good_ones_still_import(self, client, seed, conn):
        world = World(seed, conn)
        seats(conn, world)
        rows = [student(1, world), student(2, world, department="Nowhere"), student(3, world, email=mail(world, 1))]

        card, _ = propose(client, world, world.admin, "import_students", rows=rows)

        assert "(2 will be skipped)" in card["summary"]
        why = {r[0]: r[2] for r in card["details"]["table"]["rows"]}
        assert "not found" in why[2] and "twice" in why[3]
        confirm(client, world.admin, card)
        assert world.scalar("SELECT count(*) FROM users WHERE tenant_id = %s AND email LIKE 'new%%@example.com'", world.tenant_id) == 1

    def test_an_existing_enrollment_number_or_email_is_skipped(self, client, seed, conn):
        world = World(seed, conn)
        seats(conn, world)
        taken = world.scalar("SELECT enrollment_number FROM students WHERE id = %s", world.students[0])
        email = f"existing-{world.tenant_id[:10]}@example.com"  # the seeded addresses use a reserved domain
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET email = %s WHERE id = %s", (email, world.student_user(world.students[1])))
        rows = [student(1, world), student(2, world, enrollment_number=taken), student(3, world, email=email)]
        card, _ = propose(client, world, world.admin, "import_students", rows=rows)
        assert {r[0] for r in card["details"]["table"]["rows"]} == {2, 3}

    def test_nothing_importable_means_no_card(self, client, seed, conn):
        world = World(seed, conn)
        seats(conn, world)
        card, told = propose(client, world, world.admin, "import_students", rows=[student(1, world, department="Nowhere")])
        assert card is None and "No row can be imported" in told["error"]

    def test_the_licence_limit_is_checked_before_the_card(self, client, seed, conn):
        world = World(seed, conn)
        seats(conn, world, count=0)
        card, told = propose(client, world, world.admin, "import_students", rows=[student(1, world)])
        assert card is None and "license capacity" in told["error"]

    def test_the_model_cannot_set_a_password(self, client, seed, conn):
        world = World(seed, conn)
        seats(conn, world)
        card, told = propose(client, world, world.admin, "import_students", rows=[student(1, world, password="hunter22")])
        assert card is not None
        confirm(client, world.admin, card)
        assert world.scalar("SELECT must_change_password FROM users WHERE email = %s", mail(world, 1)) is True

    def test_rows_land_in_the_callers_institution_only(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        seats(conn, world)
        card, told = propose(client, world, world.admin, "import_students", rows=[student(1, world, department=dept_code(other))])
        assert card is None or world.scalar("SELECT count(*) FROM students WHERE tenant_id = %s AND department_id = %s", other.tenant_id, other.department_id) == 0

    def test_a_teacher_cannot_import(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.teacher, "import_students", rows=[student(1, world)])
        assert card is None and "not available" in told["error"]


class TestImportTeachers:
    def teacher_row(self, n, **extra):
        return {"email": f"staff{n}-{uuid.uuid4().hex[:8]}@example.com", "employee_id": f"EMP{n:04d}", "first_name": "Staff", "last_name": f"No{n}", **extra}

    def test_teachers_are_imported_and_a_taken_employee_id_is_skipped(self, client, seed, conn):
        world = World(seed, conn)
        seats(conn, world)
        taken = world.scalar("SELECT employee_id FROM teachers WHERE id = %s", world.teacher_id)
        card, _ = propose(client, world, world.admin, "import_teachers", rows=[self.teacher_row(1), self.teacher_row(2, employee_id=taken)])
        assert "(1 will be skipped)" in card["summary"]
        confirm(client, world.admin, card)
        assert world.scalar("SELECT count(*) FROM teachers WHERE tenant_id = %s AND employee_id = 'EMP0001'", world.tenant_id) == 1


def today_slot(seed, world, teacher_id, start="09:00", end="10:00", section=None, **extra):
    today = get_ist_today()
    return seed.insert(
        "class_occurrences", tenant_id=world.tenant_id, course_section_id=section or world.section_id, faculty_id=teacher_id,
        date=datetime(today.year, today.month, today.day), start_time=start, end_time=end, **extra,
    )


class TestSubstitute:
    def test_free_teachers_are_suggested_and_a_busy_one_is_not(self, client, seed, conn):
        world = World(seed, conn)
        free, busy = seed.teacher(world.tenant_id), seed.teacher(world.tenant_id)
        today_slot(seed, world, world.teacher_id)
        today_slot(seed, world, busy, "09:30", "10:30", section=seed.section(world.tenant_id))

        told = ask(client, world, world.admin, "find_substitutes", teacher_id=world.teacher_id, day=get_ist_today().isoformat())

        [one] = told["classes"]["rows"]
        offered = {t["teacher_id"] for t in one["free_teachers"]}
        assert free in offered and busy not in offered and world.teacher_id not in offered

    def test_assigning_covers_the_class_tells_the_teacher_and_is_audited(self, client, seed, conn):
        world = World(seed, conn)
        cover = seed.teacher(world.tenant_id)
        occurrence = today_slot(seed, world, world.teacher_id)

        card, _ = propose(client, world, world.admin, "assign_substitute", occurrence_id=occurrence, teacher_id=cover)
        assert world.scalar("SELECT substitute_faculty_id FROM class_occurrences WHERE id = %s", occurrence) is None
        assert confirm(client, world.admin, card).status_code == 200

        assert world.scalar("SELECT substitute_faculty_id FROM class_occurrences WHERE id = %s", occurrence) == cover
        cover_user = world.scalar("SELECT user_id FROM teachers WHERE id = %s", cover)
        assert world.notifications_for(cover_user) == 1
        assert world.scalar("SELECT count(*) FROM audit_logs WHERE tenant_id = %s AND event_type = 'SUBSTITUTE_ASSIGNED'", world.tenant_id) == 1

    def test_a_teacher_with_a_clashing_class_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        busy = seed.teacher(world.tenant_id)
        occurrence = today_slot(seed, world, world.teacher_id)
        today_slot(seed, world, busy, section=seed.section(world.tenant_id))
        card, told = propose(client, world, world.admin, "assign_substitute", occurrence_id=occurrence, teacher_id=busy)
        assert card is None and "another class" in told["error"]

    def test_a_closed_class_cannot_be_covered(self, client, seed, conn):
        world = World(seed, conn)
        cover = seed.teacher(world.tenant_id)
        occurrence = today_slot(seed, world, world.teacher_id, is_attendance_locked=True)
        card, told = propose(client, world, world.admin, "assign_substitute", occurrence_id=occurrence, teacher_id=cover)
        assert card is None and "closed" in told["error"]

    def test_a_teacher_of_another_institution_cannot_cover(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        occurrence = today_slot(seed, world, world.teacher_id)
        card, told = propose(client, world, world.admin, "assign_substitute", occurrence_id=occurrence, teacher_id=other.teacher_id)
        assert card is None and "not found" in told["error"]

    def test_the_regular_teacher_cannot_be_their_own_cover(self, client, seed, conn):
        world = World(seed, conn)
        occurrence = today_slot(seed, world, world.teacher_id)
        card, told = propose(client, world, world.admin, "assign_substitute", occurrence_id=occurrence, teacher_id=world.teacher_id)
        assert card is None and "already takes" in told["error"]

    def test_a_teacher_is_not_offered_the_tools(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.teacher, "assign_substitute", occurrence_id="x", teacher_id="y")
        assert card is None and "not available" in told["error"]


class TestProxyWatch:
    def test_shared_phones_repeat_requests_and_most_flagged_are_reported_without_device_ids(self, client, seed, conn):
        world = World(seed, conn)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE students SET device_uuid = 'SECRET-DEVICE-1' WHERE id = ANY(%s)", ([world.students[0], world.students[1]],))
        for _ in range(2):
            seed.insert("device_change_requests", tenant_id=world.tenant_id, student_id=world.stranger,
                        new_device_uuid="p", updated_at=datetime.utcnow())
        occurrence = seed.occurrence(world.tenant_id)
        seed.record(world.tenant_id, occurrence, world.students[0], "FLAGGED")
        with conn.cursor() as cursor:
            cursor.execute("UPDATE attendance_records SET verified_at = now() WHERE tenant_id = %s", (world.tenant_id,))

        told = ask(client, world, world.admin, "proxy_watch")

        assert len(told["shared_phones"]["rows"][0]["students"]) == 2
        assert told["repeated_device_requests"]["rows"][0]["requests"] == 2
        assert told["most_flagged"]["rows"][0]["flagged_marks"] == 1
        assert "SECRET-DEVICE" not in str(told)
        assert "not prove" in told["note"]

    def test_it_counts_this_institution_only(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE students SET device_uuid = 'D' WHERE id = ANY(%s)", ([other.students[0], other.students[1]],))
        assert ask(client, world, world.admin, "proxy_watch")["shared_phones"]["total"] == 0

    def test_old_activity_is_ignored(self, client, seed, conn):
        world = World(seed, conn)
        old = datetime.utcnow() - timedelta(days=200)
        for _ in range(3):
            seed.insert("device_change_requests", tenant_id=world.tenant_id, student_id=world.stranger,
                        new_device_uuid="p", updated_at=old)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE device_change_requests SET created_at = %s WHERE tenant_id = %s", (old, world.tenant_id))
        assert ask(client, world, world.admin, "proxy_watch")["repeated_device_requests"]["total"] == 0
