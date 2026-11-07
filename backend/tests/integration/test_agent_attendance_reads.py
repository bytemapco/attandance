"""Reading one student, one class, one teacher, the institution's rules and the change history. Teachers stay inside their own classes."""
from datetime import date, datetime, time, timedelta

import pytest

from app.core.config import settings
from app.core.datetime_utils import get_ist_today
from app.services.agent.llm import set_llm
from tests.integration.agent_world import World, ask


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


class TestStudentAttendance:
    def test_a_teacher_reads_their_students_attendance_against_the_minimum(self, client, seed, conn):
        world = World(seed, conn)
        world.hold_classes({world.students[0]: 4, world.students[1]: 1})

        told = ask(client, world, world.teacher, "student_attendance", student_id=world.students[1])

        assert (told["overall"]["attended"], told["overall"]["held"], told["overall"]["percentage"]) == (1, 4, 25.0)
        assert told["below_minimum"] is True and told["minimum_percent"] > 25
        assert told["subjects"] == [{"class": "CE-A-1", "subject": "Maths", "attended": 1, "held": 4, "percentage": 25.0}]

    def test_a_student_above_the_minimum_is_not_flagged(self, client, seed, conn):
        world = World(seed, conn)
        world.hold_classes({world.students[0]: 4, world.students[1]: 1})
        assert ask(client, world, world.admin, "student_attendance", student_id=world.students[0])["below_minimum"] is False

    def test_the_period_limits_the_classes_counted(self, client, seed, conn):
        world = World(seed, conn)
        world.hold_classes({world.students[0]: 2}, held=4)  # present on 1 and 2 October, absent on 3 and 4
        told = ask(client, world, world.admin, "student_attendance", student_id=world.students[0], date_from="2026-10-03", date_to="2026-10-04")
        assert (told["overall"]["attended"], told["overall"]["held"]) == (0, 2)

    def test_a_teacher_cannot_read_a_student_nobody_in_their_classes_has(self, client, seed, conn):
        world = World(seed, conn)
        assert "not found" in ask(client, world, world.teacher, "student_attendance", student_id=world.stranger)["error"]

    def test_a_student_with_no_subjects_has_no_attendance_to_show(self, client, seed, conn):
        world = World(seed, conn)
        assert "not enrolled in any subject" in ask(client, world, world.admin, "student_attendance", student_id=world.stranger)["error"]

    def test_another_institutions_student_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        assert "not found" in ask(client, world, world.admin, "student_attendance", student_id=other.students[0])["error"]


class TestClassAttendance:
    def test_the_class_is_shown_by_subject_and_students_lowest_first(self, client, seed, conn):
        world = World(seed, conn)
        world.hold_classes({world.students[0]: 4, world.students[1]: 1})

        told = ask(client, world, world.teacher, "class_attendance", class_id=world.group_id)

        assert told["subjects"] == [{"subject": "Maths", "attended": 5, "held": 8, "percentage": 62.5}]
        assert [s["percentage"] for s in told["students_lowest_first"]["rows"]] == [25.0, 100.0]
        assert told["students_lowest_first"]["rows"][0]["student_id"] == world.students[1]

    def test_students_with_no_class_held_yet_are_counted_not_listed(self, client, seed, conn):
        world = World(seed, conn)
        told = ask(client, world, world.admin, "class_attendance", class_id=world.group_id)
        assert told["students_lowest_first"]["rows"] == [] and told["students_without_classes_yet"] == 2

    def test_a_teacher_cannot_read_a_class_they_do_not_teach(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        assert "error" in ask(client, world, world.teacher, "class_attendance", class_id=other.group_id)

    def test_an_admin_cannot_read_another_institutions_class(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        assert "error" in ask(client, world, world.admin, "class_attendance", class_id=other.group_id)

    def test_a_teacher_can_see_the_trend_of_their_own_classes(self, client, seed, conn):
        world = World(seed, conn)
        for days_ago, present in ((40, True), (5, False)):
            occurrence = seed.insert("class_occurrences", tenant_id=world.tenant_id, course_section_id=world.section_id,
                                     date=datetime.combine(get_ist_today() - timedelta(days=days_ago), time.min),
                                     start_time="09:00", end_time="10:00", faculty_id=world.teacher_id, status="CONDUCTED", is_attendance_locked=True)
            for student_id in world.students:
                seed.record(world.tenant_id, occurrence, student_id, "PRESENT" if present else "ABSENT")
        told = ask(client, world, world.teacher, "attendance_trend", days=30)
        assert told["classes"]["rows"][0]["change"] == -100.0


class TestTeacherReads:
    def test_a_teacher_profile_shows_subjects_and_weekly_timetable(self, client, seed, conn):
        world = World(seed, conn)
        seed.insert("timetable_rules", tenant_id=world.tenant_id, course_section_id=world.section_id, teacher_id=world.teacher_id,
                    day_of_week=2, start_time="10:00", end_time="11:00", effective_from=date(2026, 8, 1))

        told = ask(client, world, world.admin, "teacher_profile", teacher_id=world.teacher_id)

        assert told["name"] == "Test Teacher" and told["weekly_slots"] == 1
        assert told["timetable"]["rows"][0]["day"] == "Tue" and told["subjects_taught"] == ["CE-A-1 Maths"]

    def test_an_admin_reads_what_a_teacher_has_on_a_day(self, client, seed, conn):
        world = World(seed, conn)
        today = get_ist_today()
        seed.insert("class_occurrences", tenant_id=world.tenant_id, course_section_id=world.section_id, date=datetime(today.year, today.month, today.day),
                    start_time="09:00", end_time="10:00", faculty_id=world.teacher_id)
        told = ask(client, world, world.admin, "teacher_schedule", teacher_id=world.teacher_id)
        assert [c["subject"] for c in told["classes"]["rows"]] == ["Maths"]

    def test_another_institutions_teacher_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        assert "not found" in ask(client, world, world.admin, "teacher_profile", teacher_id=other.teacher_id)["error"]
        assert "not found" in ask(client, world, world.admin, "teacher_schedule", teacher_id=other.teacher_id)["error"]

    def test_a_teacher_cannot_look_at_colleagues(self, client, seed, conn):
        world = World(seed, conn)
        assert "not available" in ask(client, world, world.teacher, "teacher_profile", teacher_id=world.teacher_id)["error"]


class TestOversight:
    def test_the_rules_and_seats_are_read_without_the_campus_coordinates(self, client, seed, conn):
        world = World(seed, conn)
        told = ask(client, world, world.admin, "institution_settings")
        assert told["rules"]["minimum_attendance_percent"] == 75.0 and told["rules"]["campus_location_set"] is False
        assert {"seats", "used", "left"} <= set(told["licence"])
        assert "latitude" not in str(told).lower()

    def test_a_teacher_cannot_read_the_institutions_rules(self, client, seed, conn):
        world = World(seed, conn)
        assert "not available" in ask(client, world, world.teacher, "institution_settings")["error"]

    def test_attendance_changes_show_who_changed_what_and_why(self, client, seed, conn):
        world = World(seed, conn)
        occurrence = seed.occurrence(world.tenant_id, world.section_id, world.teacher_id)
        record = seed.record(world.tenant_id, occurrence, world.students[0], "PRESENT")
        seed.insert("attendance_audit_logs", attendance_record_id=record, previous_status="ABSENT", new_status="PRESENT",
                    changed_by_id=world.teacher_user, reason="Was in the lab")

        told = ask(client, world, world.admin, "audit_trail", kind="attendance_changes")

        change = told["changes"]["rows"][0]
        assert (change["from"], change["to"], change["reason"]) == ("ABSENT", "PRESENT", "Was in the lab")
        assert ask(client, world, world.admin, "audit_trail", kind="attendance_changes", student_id=world.students[1])["changes"]["rows"] == []

    def test_changes_in_another_institution_are_never_shown(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        record = seed.record(other.tenant_id, seed.occurrence(other.tenant_id, other.section_id, other.teacher_id), other.students[0], "PRESENT")
        seed.insert("attendance_audit_logs", attendance_record_id=record, previous_status="ABSENT", new_status="PRESENT",
                    changed_by_id=other.teacher_user, reason="Secret")
        assert ask(client, world, world.admin, "audit_trail", kind="attendance_changes")["changes"]["rows"] == []

    def test_admin_actions_list_only_this_institutions_recent_events(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        seed.insert("audit_logs", tenant_id=world.tenant_id, actor="admin@example.test", event_type="CREATE_STUDENT", severity="INFO",
                    target="x", description="Created student a@b.test")
        seed.insert("audit_logs", tenant_id=other.tenant_id, actor="x@y.test", event_type="CREATE_STUDENT", severity="INFO",
                    target="x", description="Hidden")
        events = ask(client, world, world.admin, "audit_trail", kind="admin_actions")["actions"]["rows"]
        assert [e["what"] for e in events] == ["Created student a@b.test"]


class TestNotifications:
    def test_a_person_reads_their_own_unread_notifications(self, client, seed, conn):
        world = World(seed, conn)
        seed.insert("notifications", tenant_id=world.tenant_id, user_id=world.teacher_user, role="TEACHER", title="Leave request", message="Asha asked for leave")
        seed.insert("notifications", tenant_id=world.tenant_id, user_id=world.teacher_user, role="TEACHER", title="Old", message="Seen", is_read=True)
        seed.insert("notifications", tenant_id=world.tenant_id, user_id=world.admin_user, role="TENANT_ADMIN", title="For the admin", message="Not yours")

        told = ask(client, world, world.teacher, "my_notifications", unread_only=True)

        assert told["unread_total"] == 1 and [n["title"] for n in told["latest"]] == ["Leave request"]
