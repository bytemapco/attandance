"""Department, subject, classroom and designation bulk imports keep every field and refuse duplicates."""
import pytest

from tests.integration.bulk_import_world import CLASSROOMS, DEPARTMENTS, DESIGNATIONS, SUBJECTS, reasons, tag

REMOVED = [
    ("departments", "head"),
    ("departments", "description"),
    ("designations", "description"),
    ("subjects", "description"),
    ("classrooms", "building"),
]


@pytest.mark.parametrize("table, column", REMOVED)
def test_a_field_nothing_uses_is_no_longer_stored(school, table, column):
    found = school.query(
        "SELECT count(*) FROM information_schema.columns WHERE table_name = %s AND column_name = %s", table, column
    )

    assert found == [(0,)]


@pytest.mark.parametrize(
    "path, key, row, removed",
    [
        (DEPARTMENTS, "departments", {"name": "Civil", "code": "CE", "head": "Dr. Rao"}, "head"),
        (DEPARTMENTS, "departments", {"name": "Civil", "code": "CE", "description": "Structures"}, "description"),
        (SUBJECTS, "subjects", {"name": "Maths", "code": "MA101", "description": "Core"}, "description"),
        (CLASSROOMS, "classrooms", {"name": "Room 1", "building": "A"}, "building"),
        (DESIGNATIONS, "designations", {"name": "Professor", "code": "PROF", "description": "Chair"}, "description"),
    ],
)
def test_a_file_that_still_has_a_removed_column_is_refused_row_by_row(school, path, key, row, removed):
    result = school.run(path, [row], key)

    assert reasons(result) == {1: f"{removed}: Extra inputs are not permitted"}


class TestDepartments:
    def test_name_and_code_are_saved(self, school):
        code = f"X{tag()}".upper()

        result = school.run(DEPARTMENTS, [{"name": "Civil Engineering", "code": code}], "departments")

        assert result["imported_count"] == 1
        assert school.query(
            "SELECT name FROM departments WHERE tenant_id = %s AND code = %s", school.tenant, code
        ) == [("Civil Engineering",)]

    def test_a_code_already_used_is_refused_whatever_its_case(self, school):
        rows = [
            {"name": "Duplicate", "code": school.department_code.lower()},
            {"name": "New one", "code": "NEW1"},
            {"name": "Same again", "code": "new1"},
        ]

        result = school.run(DEPARTMENTS, rows, "departments")

        assert result["imported_count"] == 1
        assert reasons(result) == {
            1: f"Department code '{school.department_code.lower()}' already exists.",
            3: "Department code 'new1' already exists.",
        }

    def test_a_name_or_code_that_is_too_short_is_refused(self, school):
        result = school.run(DEPARTMENTS, [{"name": "A", "code": "AB"}, {"name": "Ab", "code": "C"}], "departments")

        assert set(reasons(result)) == {1, 2}


class TestSubjects:
    def test_the_department_is_linked_by_code_or_name(self, school):
        rows = [
            {"name": "Data Structures", "code": "CS201", "department_id": school.department_code},
            {"name": "Algorithms", "code": "CS202", "department_id": school.department_name},
            {"name": "Free elective", "code": "EL100"},
        ]

        assert school.run(SUBJECTS, rows, "subjects")["imported_count"] == 3

        saved = school.query("SELECT code, department_id FROM subjects WHERE tenant_id = %s ORDER BY code", school.tenant)
        assert saved == [("CS201", school.department), ("CS202", school.department), ("EL100", None)]

    def test_an_unknown_department_is_refused_not_silently_dropped(self, school):
        result = school.run(SUBJECTS, [{"name": "Data Structures", "code": "CS201", "department_id": "NOPE"}], "subjects")

        assert reasons(result) == {1: "Department 'NOPE' not found."}
        assert school.count("subjects") == 0

    def test_a_repeated_code_is_refused_whatever_its_case(self, school):
        rows = [{"name": "First", "code": "CS201"}, {"name": "Second", "code": "cs201"}]

        result = school.run(SUBJECTS, rows, "subjects")

        assert result["imported_count"] == 1 and reasons(result) == {2: "Subject code 'cs201' already exists."}


class TestClassrooms:
    def test_the_name_is_saved(self, school):
        assert school.run(CLASSROOMS, [{"name": "Room 101"}, {"name": "Seminar hall"}], "classrooms")["imported_count"] == 2

        assert school.query("SELECT name FROM classrooms WHERE tenant_id = %s ORDER BY name", school.tenant) == [
            ("Room 101",), ("Seminar hall",),
        ]

    def test_importing_the_same_file_twice_does_not_duplicate_rooms(self, school):
        rows = [{"name": "Room 101"}, {"name": "Seminar hall"}]
        school.run(CLASSROOMS, rows, "classrooms")

        again = school.run(CLASSROOMS, rows, "classrooms")

        assert again["imported_count"] == 0
        assert reasons(again) == {1: "Classroom 'Room 101' already exists.", 2: "Classroom 'Seminar hall' already exists."}
        assert school.count("classrooms") == 2

    def test_a_room_name_repeats_whatever_its_case(self, school):
        result = school.run(CLASSROOMS, [{"name": "Room 101"}, {"name": "ROOM 101"}], "classrooms")

        assert result["imported_count"] == 1 and reasons(result) == {2: "Classroom 'ROOM 101' already exists."}


class TestDesignations:
    def test_name_and_code_are_saved(self, school):
        result = school.run(DESIGNATIONS, [{"name": "Professor", "code": "PROF"}], "designations")

        assert result["imported_count"] == 1
        assert school.query("SELECT name FROM designations WHERE tenant_id = %s AND code = 'PROF'", school.tenant) == [("Professor",)]

    def test_a_repeated_code_is_refused_whatever_its_case(self, school):
        rows = [{"name": "Professor", "code": "PROF"}, {"name": "Prof again", "code": "prof"}, {"name": "Other", "code": school.designation_code}]

        result = school.run(DESIGNATIONS, rows, "designations")

        assert result["imported_count"] == 1 and set(reasons(result)) == {2, 3}
