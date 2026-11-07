"""The admin assistant changes a class after it exists: its students, a subject's teacher, the subject itself, its timetable slots."""
from datetime import date

import pytest

from app.core.config import settings
from app.services.agent.llm import set_llm
from tests.integration.agent_world import World, confirm, count, make_primary, propose


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def other_class(seed, world, student_id):
    group = seed.insert("student_groups", tenant_id=world.tenant_id, department_id=world.department_id, batch="CE-B-1")
    seed.insert("class_members", tenant_id=world.tenant_id, group_id=group, student_id=student_id, status="ACTIVE")
    return group


def rule(seed, world, section_id=None, day=1, teacher_id=None):
    return seed.insert("timetable_rules", tenant_id=world.tenant_id, course_section_id=section_id or world.section_id,
                       teacher_id=teacher_id or world.teacher_id, day_of_week=day, start_time="09:00", end_time="10:00",
                       effective_from=date(2026, 8, 1))


class TestStudents:
    def test_a_student_joins_the_class_and_its_subjects_on_confirm(self, client, seed, conn):
        world = World(seed, conn)
        card, _ = propose(client, world, world.admin, "change_class_students", class_id=world.group_id, action="add", student_ids=[world.stranger])
        assert count(world, "class_members", "group_id = %s", world.group_id) == 0

        assert confirm(client, world.admin, card).status_code == 200
        assert count(world, "class_members", "group_id = %s AND status = 'ACTIVE'", world.group_id) == 1
        assert count(world, "course_enrollments", "course_section_id = %s AND student_id = %s", world.section_id, world.stranger) == 1

    def test_a_student_already_in_another_class_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        other_class(seed, world, world.stranger)
        card, told = propose(client, world, world.admin, "change_class_students", class_id=world.group_id, action="add", student_ids=[world.stranger])
        assert card is None and "another class" in told["error"]

    def test_a_student_of_another_institution_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        card, told = propose(client, world, world.admin, "change_class_students", class_id=world.group_id, action="add", student_ids=[other.students[0]])
        assert card is None and "not found" in told["error"]

    def test_removing_needs_a_reason_and_leaves_the_history(self, client, seed, conn):
        world = World(seed, conn)
        seed.insert("class_members", tenant_id=world.tenant_id, group_id=world.group_id, student_id=world.students[0], status="ACTIVE")
        card, told = propose(client, world, world.admin, "change_class_students", class_id=world.group_id, action="remove", student_ids=[world.students[0]])
        assert card is None and "reason" in told["error"]

        card, _ = propose(client, world, world.admin, "change_class_students", class_id=world.group_id, action="remove",
                          student_ids=[world.students[0]], reason="Left the college")
        assert confirm(client, world.admin, card).status_code == 200
        assert world.scalar("SELECT status FROM class_members WHERE student_id = %s", world.students[0]) == "TRANSFERRED"

    def test_removing_someone_who_is_not_in_the_class_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "change_class_students", class_id=world.group_id, action="remove",
                             student_ids=[world.stranger], reason="Left the college")
        assert card is None and "not in this class" in told["error"]


class TestSubjectTeacher:
    def test_a_subject_gets_another_teacher_for_upcoming_classes(self, client, seed, conn):
        world = World(seed, conn)
        make_primary(conn, world)
        newcomer = seed.teacher(world.tenant_id)
        card, _ = propose(client, world, world.admin, "change_subject_teacher", class_id=world.group_id, section_id=world.section_id, teacher_id=newcomer)
        assert "Future classes" in card["details"]["note"]

        assert confirm(client, world.admin, card).status_code == 200
        assert world.scalar("SELECT teacher_id FROM course_faculties WHERE course_section_id = %s AND is_primary", world.section_id) == newcomer

    def test_the_teacher_who_already_teaches_it_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        make_primary(conn, world)
        card, told = propose(client, world, world.admin, "change_subject_teacher", class_id=world.group_id, section_id=world.section_id, teacher_id=world.teacher_id)
        assert card is None and "already teaches" in told["error"]

    def test_a_teacher_with_a_clash_is_refused_before_the_card(self, client, seed, conn):
        world = World(seed, conn)
        make_primary(conn, world)
        busy = seed.teacher(world.tenant_id)
        rule(seed, world)
        rule(seed, world, section_id=seed.section(world.tenant_id), teacher_id=busy)
        card, told = propose(client, world, world.admin, "change_subject_teacher", class_id=world.group_id, section_id=world.section_id, teacher_id=busy)
        assert card is None and "already has a class on Mon" in told["error"]
        assert world.scalar("SELECT teacher_id FROM course_faculties WHERE course_section_id = %s AND is_primary", world.section_id) == world.teacher_id


class TestSubjectsAndSlots:
    def test_a_subject_without_attendance_is_removed_from_the_class(self, client, seed, conn):
        world = World(seed, conn)
        card, _ = propose(client, world, world.admin, "remove_subject_from_class", class_id=world.group_id, section_id=world.section_id)
        assert confirm(client, world.admin, card).status_code == 200
        assert count(world, "course_sections", "id = %s", world.section_id) == 0

    def test_a_subject_with_attendance_cannot_be_removed(self, client, seed, conn):
        world = World(seed, conn)
        world.hold_classes({world.students[0]: 2})
        card, told = propose(client, world, world.admin, "remove_subject_from_class", class_id=world.group_id, section_id=world.section_id)
        assert card is None and "already been recorded" in told["error"]

    def test_timetable_slots_are_removed_on_confirm(self, client, seed, conn):
        world = World(seed, conn)
        rules = [rule(seed, world, day=1), rule(seed, world, day=3)]
        card, _ = propose(client, world, world.admin, "remove_schedule_slots", class_id=world.group_id, section_id=world.section_id, rule_ids=rules)
        assert [row[0] for row in card["details"]["table"]["rows"]] == ["Mon", "Wed"]
        confirm(client, world.admin, card)
        assert count(world, "timetable_rules", "course_section_id = %s", world.section_id) == 0

    def test_a_slot_of_another_subject_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        card, told = propose(client, world, world.admin, "remove_schedule_slots", class_id=world.group_id, section_id=world.section_id,
                             rule_ids=[rule(seed, other, section_id=other.section_id, teacher_id=other.teacher_id)])
        assert card is None and "not found" in told["error"]

    def test_an_archived_class_cannot_be_edited(self, client, seed, conn):
        world = World(seed, conn)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE student_groups SET status = 'ARCHIVED' WHERE id = %s", (world.group_id,))
        card, told = propose(client, world, world.admin, "remove_subject_from_class", class_id=world.group_id, section_id=world.section_id)
        assert card is None and "archived" in told["error"]
