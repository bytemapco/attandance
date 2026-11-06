"""The admin setup agent: master data, batches, classes, subjects with teachers, timetables. Each waits for Confirm."""
import pytest

from app.core.config import settings
from app.services.agent.llm import set_llm
from tests.integration.agent_world import World, ScriptedModel, calls, confirm, events, propose, says, ACCEPT, CHAT


@pytest.fixture(autouse=True)
def assistant_on(monkeypatch):
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    yield
    set_llm(None)


def count(world, table, where="tenant_id = %s", *params):
    return world.scalar(f"SELECT count(*) FROM {table} WHERE {where}", *(params or (world.tenant_id,)))


def ask(client, world, headers, tool, **args):
    """Has the model call one read tool; returns what the model was told."""
    client.post(ACCEPT, headers=world.admin)
    model = ScriptedModel(calls(tool, **args), says("done"))
    set_llm(model)
    events(client.post(CHAT, json={"message": "go"}, headers=headers))
    return model.tool_results[0]


def batch(seed, world, code="A-1"):
    """Batch codes carry the department code, like CE-A-1."""
    prefix = world.scalar("SELECT code FROM departments WHERE id = %s", world.department_id)
    return seed.insert("batches", tenant_id=world.tenant_id, department_id=world.department_id, section=code[0],
                       number=int(code[-1]), code=f"{prefix}-{code}", status="ACTIVE")


def make_primary(conn, world):
    with conn.cursor() as cursor:
        cursor.execute("UPDATE course_faculties SET is_primary = true WHERE course_section_id = %s", (world.section_id,))


class TestMasterData:
    def test_departments_are_created_only_after_confirm_and_audited(self, client, seed, conn):
        world = World(seed, conn)
        before = count(world, "departments")

        card, _ = propose(client, world, world.admin, "create_departments", items=[{"name": "Mechanical", "code": "ME"}, {"name": "Civil", "code": "CV"}])
        assert card["summary"] == "Create 2 departments" and count(world, "departments") == before
        done = confirm(client, world.admin, card)

        assert done.status_code == 200 and count(world, "departments") == before + 2
        assert count(world, "audit_logs", "tenant_id = %s AND event_type = 'BULK_IMPORT_DEPARTMENTS'") == 1

    def test_an_existing_code_is_refused_even_in_other_case(self, client, seed, conn):
        world = World(seed, conn)
        code = world.scalar("SELECT code FROM departments WHERE id = %s", world.department_id)
        card, told = propose(client, world, world.admin, "create_departments", items=[{"name": "Again", "code": code.lower()}])
        assert card is None and "already exist" in told["error"]

    def test_the_same_code_twice_in_one_list_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "create_departments", items=[{"name": "One", "code": "XX"}, {"name": "Two", "code": "xx"}])
        assert card is None and "twice" in told["error"]

    def test_another_institution_may_use_the_same_code(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        code = world.scalar("SELECT code FROM departments WHERE id = %s", other.department_id)
        card, _ = propose(client, world, world.admin, "create_departments", items=[{"name": "Same", "code": code}])
        assert card is not None

    def test_subjects_and_classrooms_are_created_on_confirm(self, client, seed, conn):
        world = World(seed, conn)
        subjects, _ = propose(client, world, world.admin, "create_subjects", items=[{"name": "Physics", "code": "PH101", "department_id": world.department_id}])
        rooms, _ = propose(client, world, world.admin, "create_classrooms", items=[{"name": "B-204", "building": "Block B"}])
        confirm(client, world.admin, subjects)
        confirm(client, world.admin, rooms)
        assert count(world, "subjects", "tenant_id = %s AND code = 'PH101'") == 1
        assert count(world, "classrooms", "tenant_id = %s AND name = 'B-204'") == 1

    def test_a_subject_in_another_institutions_department_is_refused(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        card, told = propose(client, world, world.admin, "create_subjects", items=[{"name": "Physics", "code": "PH1", "department_id": other.department_id}])
        assert card is None and "not found" in told["error"]

    def test_a_teacher_is_not_offered_setup_tools(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.teacher, "create_departments", items=[{"name": "Mechanical", "code": "ME"}])
        assert card is None and "not available" in told["error"]


class TestClasses:
    def test_batches_continue_the_numbering(self, client, seed, conn):
        world = World(seed, conn)
        batch(seed, world, "A-1")
        card, _ = propose(client, world, world.admin, "create_batches", department_id=world.department_id, section="A", count=2)
        confirm(client, world.admin, card)
        codes = world.scalar("SELECT string_agg(right(code, 3), ',' ORDER BY code) FROM batches WHERE tenant_id = %s", world.tenant_id)
        assert codes == "A-1,A-2,A-3"

    def test_a_class_adopts_the_batchs_students_who_are_in_no_class(self, client, seed, conn):
        world = World(seed, conn)
        batch_id = batch(seed, world)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE students SET batch_id = %s WHERE id = ANY(%s)", (batch_id, [world.students[0], world.students[1]]))

        card, _ = propose(client, world, world.admin, "create_class", department_id=world.department_id, batch_id=batch_id, semester_number=3)
        assert "2 students" in card["details"]["note"]
        done = confirm(client, world.admin, card)

        assert done.status_code == 200
        assert count(world, "class_members", "tenant_id = %s AND status = 'ACTIVE'") == 2
        assert world.scalar("SELECT semester FROM student_groups WHERE batch_id = %s", batch_id) == 3

    def test_a_second_class_for_the_same_batch_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        batch_id = batch(seed, world)
        card, _ = propose(client, world, world.admin, "create_class", department_id=world.department_id, batch_id=batch_id, semester_number=1)
        confirm(client, world.admin, card)
        again, told = propose(client, world, world.admin, "create_class", department_id=world.department_id, batch_id=batch_id, semester_number=2)
        assert again is None and "already exists" in told["error"]

    def test_a_batch_of_another_institution_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        card, told = propose(client, world, world.admin, "create_class", department_id=world.department_id, batch_id=batch(seed, other), semester_number=1)
        assert card is None and "not found" in told["error"]

    def test_the_semester_is_changed_on_confirm(self, client, seed, conn):
        world = World(seed, conn)
        card, _ = propose(client, world, world.admin, "set_class_semester", class_id=world.group_id, semester_number=5)
        assert "from semester 1 to 5" in card["summary"]
        confirm(client, world.admin, card)
        assert world.scalar("SELECT semester FROM student_groups WHERE id = %s", world.group_id) == 5


class TestSubjectsAndTimetable:
    def new_subject(self, seed, world):
        return seed.insert("subjects", tenant_id=world.tenant_id, code="PH1", name="Physics")

    def test_a_subject_with_its_teacher_is_added_and_the_students_are_enrolled(self, client, seed, conn):
        world = World(seed, conn)
        subject, teacher = self.new_subject(seed, world), seed.teacher(world.tenant_id)
        with conn.cursor() as cursor:
            cursor.execute("UPDATE students SET batch = 'CE-A-1' WHERE id = %s", (world.students[0],))
        seed.insert("class_members", tenant_id=world.tenant_id, group_id=world.group_id, student_id=world.students[0], status="ACTIVE")

        card, _ = propose(client, world, world.admin, "add_subject_to_class", class_id=world.group_id, subject_id=subject, teacher_id=teacher)
        assert confirm(client, world.admin, card).status_code == 200

        assert count(world, "course_sections", "tenant_id = %s AND subject_id = %s", world.tenant_id, subject) == 1

    def test_the_same_subject_twice_in_a_class_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        subject = world.scalar("SELECT subject_id FROM course_sections WHERE id = %s", world.section_id)
        card, told = propose(client, world, world.admin, "add_subject_to_class", class_id=world.group_id, subject_id=subject, teacher_id=world.teacher_id)
        assert card is None and "already in this class" in told["error"]

    def test_a_teacher_from_another_institution_is_refused(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        card, told = propose(client, world, world.admin, "add_subject_to_class", class_id=world.group_id,
                             subject_id=self.new_subject(seed, world), teacher_id=other.teacher_id)
        assert card is None and "not found" in told["error"]

    def slot(self, day=1, start="09:00", end="10:00"):
        return {"day_of_week": day, "start_time": start, "end_time": end}

    def test_weekly_slots_are_added_on_confirm(self, client, seed, conn):
        world = World(seed, conn)
        make_primary(conn, world)
        card, _ = propose(client, world, world.admin, "add_schedule", class_id=world.group_id, section_id=world.section_id,
                          slots=[self.slot(1), self.slot(3, "11:00", "12:00")])
        assert card["details"]["table"]["rows"][0][0] == "Monday"
        confirm(client, world.admin, card)
        assert count(world, "timetable_rules", "course_section_id = %s", world.section_id) == 2

    def test_two_overlapping_slots_in_one_request_are_refused(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "add_schedule", class_id=world.group_id, section_id=world.section_id,
                             slots=[self.slot(1, "09:00", "10:00"), self.slot(1, "09:30", "10:30")])
        assert card is None and "overlap" in told["error"]

    def test_an_end_before_the_start_is_refused(self, client, seed, conn):
        world = World(seed, conn)
        card, told = propose(client, world, world.admin, "add_schedule", class_id=world.group_id, section_id=world.section_id,
                             slots=[self.slot(1, "10:00", "09:00")])
        assert card is None and "error" in told

    def test_a_clash_found_on_confirm_says_how_many_slots_were_already_added(self, client, seed, conn):
        world = World(seed, conn)
        make_primary(conn, world)
        card, _ = propose(client, world, world.admin, "add_schedule", class_id=world.group_id, section_id=world.section_id,
                          slots=[self.slot(1), self.slot(6, "09:00", "10:00")])  # Saturday is off by default
        done = confirm(client, world.admin, card)
        assert done.status_code == 400 and "Added 1 of 2 slots" in done.json()["detail"]

    def test_a_section_from_another_class_is_not_found(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        card, told = propose(client, world, world.admin, "add_schedule", class_id=world.group_id, section_id=other.section_id, slots=[self.slot()])
        assert card is None and "not found" in told["error"]


class TestLookups:
    def test_overview_gives_the_section_ids_a_timetable_needs(self, client, seed, conn):
        world = World(seed, conn)
        told = ask(client, world, world.admin, "class_overview", class_id=world.group_id)
        assert told["subjects"]["rows"][0]["section_id"] == world.section_id

    def test_a_new_class_with_no_subjects_is_still_listed(self, client, seed, conn):
        world = World(seed, conn)
        new_batch = batch(seed, world, "B-1")
        card, _ = propose(client, world, world.admin, "create_class", department_id=world.department_id, batch_id=new_batch, semester_number=2)
        confirm(client, world.admin, card)
        told = ask(client, world, world.admin, "list_all_classes")
        assert any(c["code"].endswith("B-1") for c in told["classes"]["rows"])

    def test_setup_items_are_found_by_name_and_stay_inside_the_institution(self, client, seed, conn):
        world, other = World(seed, conn), World(seed, conn)
        mine = world.scalar("SELECT name FROM departments WHERE id = %s", world.department_id)
        told = ask(client, world, world.admin, "find_setup_items", kind="department", text=mine)
        found = {d["department_id"] for d in told["items"]["rows"]}
        assert world.department_id in found and other.department_id not in found
