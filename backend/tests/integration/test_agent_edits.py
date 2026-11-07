"""The admin assistant corrects and removes setup records and people's details. Every change waits for Confirm and keeps the product's own rules."""
import pytest

from app.core.config import settings
from app.services.agent.llm import set_llm
from tests.integration.agent_world import World, batch, confirm, count, propose


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def code_of(world, department_id=None):
    return world.scalar("SELECT code FROM departments WHERE id = %s", department_id or world.department_id)


class TestMasterDataEdits:
    def test_a_department_is_renamed_only_after_confirm(self, client, seed, conn):
        world = World(seed, conn)
        card, _ = propose(client, world, world.admin, "update_master_item", kind="department", item_id=world.department_id, name="Computer Science")
        assert card["details"]["table"]["rows"] == [["Name", "Computer Engineering", "Computer Science"]]
        assert world.scalar("SELECT name FROM departments WHERE id = %s", world.department_id) == "Computer Engineering"

        assert confirm(client, world.admin, card).status_code == 200
        assert world.scalar("SELECT name FROM departments WHERE id = %s", world.department_id) == "Computer Science"

    def test_a_code_used_by_another_department_is_refused_in_any_case(self, client, seed, conn):
        world = World(seed, conn)
        second = seed.department(world.tenant_id)
        card, told = propose(client, world, world.admin, "update_master_item", kind="department", item_id=second, code=code_of(world).upper())
        assert card is None and "already uses" in told["error"]

    def test_a_field_the_kind_does_not_have_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "update_master_item", kind="department", item_id=world.department_id, department_id=world.department_id)
        assert card is None and "no department_id" in told["error"]

    def test_asking_for_what_is_already_true_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "update_master_item", kind="department", item_id=world.department_id, name="Computer Engineering")
        assert card is None and "Nothing would change" in told["error"]

    def test_another_institutions_record_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        card, told = propose(client, world, world.admin, "update_master_item", kind="department", item_id=other.department_id, name="Stolen")
        assert card is None and "not found" in told["error"]

    def test_a_subject_moves_to_a_department_of_this_institution_only(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        subject = seed.insert("subjects", tenant_id=world.tenant_id, code="PH9", name="Physics")
        card, told = propose(client, world, world.admin, "update_master_item", kind="subject", item_id=subject, department_id=other.department_id)
        assert card is None and "not found" in told["error"]

    def test_an_unused_classroom_is_deleted_on_confirm_and_audited(self, client, seed, conn):
        world = World(seed, conn)
        room = seed.insert("classrooms", tenant_id=world.tenant_id, name="B-101")
        card, _ = propose(client, world, world.admin, "delete_master_item", kind="classroom", item_id=room)
        assert count(world, "classrooms", "id = %s", room) == 1

        assert confirm(client, world.admin, card).status_code == 200
        assert count(world, "classrooms", "id = %s", room) == 0
        assert count(world, "audit_logs", "tenant_id = %s AND event_type = 'DELETE_CLASSROOM'") == 1

    def test_a_department_still_in_use_cannot_be_deleted(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "delete_master_item", kind="department", item_id=world.department_id)
        assert card is None and "currently assigned" in told["error"]

    def test_a_subject_in_a_class_cannot_be_deleted(self, client, seed, conn):
        world = World(seed, conn)
        subject = world.scalar("SELECT subject_id FROM course_sections WHERE id = %s", world.section_id)
        card, told = propose(client, world, world.admin, "delete_master_item", kind="subject", item_id=subject)
        assert card is None and "currently assigned" in told["error"]

    def test_designations_are_created_and_a_repeated_code_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        card, _ = propose(client, world, world.admin, "create_designations", items=[{"name": "Professor", "code": "PROF"}])
        confirm(client, world.admin, card)
        assert count(world, "designations", "tenant_id = %s AND code = 'PROF'") == 1
        again, told = propose(client, world, world.admin, "create_designations", items=[{"name": "Prof", "code": "prof"}])
        assert again is None and "already exist" in told["error"]

    def test_an_empty_batch_is_archived_then_deleted_but_one_with_students_only_archived(self, client, seed, conn):
        world = World(seed, conn)
        empty, used = batch(seed, world, "A-1"), batch(seed, world, "A-2")
        with conn.cursor() as cursor:
            cursor.execute("UPDATE students SET batch_id = %s WHERE id = %s", (used, world.students[0]))

        card, _ = propose(client, world, world.admin, "change_batch", batch_id=used, action="archive")
        assert confirm(client, world.admin, card).status_code == 200
        assert world.scalar("SELECT status FROM batches WHERE id = %s", used) == "ARCHIVED"

        refused, told = propose(client, world, world.admin, "change_batch", batch_id=used, action="delete")
        assert refused is None and "Archive it instead" in told["error"]

        card, _ = propose(client, world, world.admin, "change_batch", batch_id=empty, action="delete")
        confirm(client, world.admin, card)
        assert count(world, "batches", "id = %s", empty) == 0

    def test_a_batch_already_archived_cannot_be_archived_again(self, client, seed, conn):
        world = World(seed, conn)
        archived = batch(seed, world)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE batches SET status = 'ARCHIVED' WHERE id = %s", (archived,))
        card, told = propose(client, world, world.admin, "change_batch", batch_id=archived, action="archive")
        assert card is None and "already archived" in told["error"]

    def test_a_teacher_is_not_offered_these_tools(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.teacher, "delete_master_item", kind="department", item_id=world.department_id)
        assert card is None and "not available" in told["error"]


class TestPeopleEdits:
    def test_a_students_details_are_corrected_on_confirm_and_audited(self, client, seed, conn):
        world = World(seed, conn)
        card, _ = propose(client, world, world.admin, "update_student", student_id=world.students[0], first_name="Asha", phone="9876543210")
        assert [row[0] for row in card["details"]["table"]["rows"]] == ["First Name", "Phone"]

        assert confirm(client, world.admin, card).status_code == 200
        assert world.scalar("SELECT first_name FROM students WHERE id = %s", world.students[0]) == "Asha"
        assert world.scalar("SELECT phone FROM students WHERE id = %s", world.students[0]) == "9876543210"
        assert count(world, "audit_logs", "tenant_id = %s AND event_type = 'UPDATE_STUDENT'") == 1

    def test_a_roll_number_another_student_has_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        taken = world.scalar("SELECT enrollment_number FROM students WHERE id = %s", world.students[1])
        card, told = propose(client, world, world.admin, "update_student", student_id=world.students[0], enrollment_number=taken.upper())
        assert card is None and "already has the roll number" in told["error"]

    def test_a_new_department_needs_a_new_batch(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "update_student", student_id=world.students[0], department_id=seed.department(world.tenant_id))
        assert card is None and "needs a batch" in told["error"]

    def test_a_batch_change_says_the_student_changes_class(self, client, seed, conn):
        world = World(seed, conn)
        target = batch(seed, world, "A-2")
        card, _ = propose(client, world, world.admin, "update_student", student_id=world.students[0], batch_id=target)
        assert "joins the new batch's class" in card["details"]["note"]
        confirm(client, world.admin, card)
        assert world.scalar("SELECT batch_id FROM students WHERE id = %s", world.students[0]) == target

    def test_another_institutions_student_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        card, told = propose(client, world, world.admin, "update_student", student_id=other.students[0], first_name="Intruder")
        assert card is None and "not found" in told["error"]

    def test_saying_nothing_to_change_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "update_student", student_id=world.students[0])
        assert card is None and "Say what to change" in told["error"]

    def test_a_teachers_designation_and_name_are_corrected(self, client, seed, conn):
        world = World(seed, conn)
        designation = seed.insert("designations", tenant_id=world.tenant_id, code="PROF", name="Professor")
        card, _ = propose(client, world, world.admin, "update_teacher", teacher_id=world.teacher_id, last_name="Rao", designation_id=designation)
        assert confirm(client, world.admin, card).status_code == 200
        assert world.scalar("SELECT last_name FROM teachers WHERE id = %s", world.teacher_id) == "Rao"
        assert world.scalar("SELECT designation_id FROM teachers WHERE id = %s", world.teacher_id) == designation

    def test_an_employee_id_another_teacher_has_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        taken = world.scalar("SELECT employee_id FROM teachers WHERE id = %s", seed.teacher(world.tenant_id))
        card, told = propose(client, world, world.admin, "update_teacher", teacher_id=world.teacher_id, employee_id=taken)
        assert card is None and "already has the employee id" in told["error"]

    def test_a_designation_of_another_institution_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        foreign = seed.insert("designations", tenant_id=other.tenant_id, code="XX", name="Dean")
        card, told = propose(client, world, world.admin, "update_teacher", teacher_id=world.teacher_id, designation_id=foreign)
        assert card is None and "not found" in told["error"]
