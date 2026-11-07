"""Bulk imports through the real API: a bad row never stops the others, and each row's problem is named."""
from tests.integration.bulk_import_world import STUDENTS, School, reasons


class TestResponseShape:
    def test_every_refused_row_is_named_with_its_position_and_reason(self, school):
        result = school.students([school.student_row(), school.student_row(last_name=""), school.student_row(email="nope")])

        assert (result["imported_count"], result["failed_count"]) == (1, 2)
        assert [failure["row"] for failure in result["failures"]] == [2, 3]
        assert result["errors"] == [f"Row {row}: {message}" for row, message in reasons(result).items()]

    def test_a_blank_required_cell_is_reported_as_missing_not_as_a_type_error(self, school):
        result = school.students([school.student_row(last_name="   ")])

        assert reasons(result) == {1: "last name is required"}

    def test_a_row_that_is_wrong_in_several_fields_names_them_all(self, school):
        result = school.students([school.student_row(email="nope", enrollment_number="E1")])

        assert "email" in reasons(result)[1] and "enrollment number" in reasons(result)[1]

    def test_a_column_the_import_does_not_know_is_refused_not_ignored(self, school):
        result = school.teachers([school.teacher_row(qualification="PhD")])

        assert reasons(result) == {1: "qualification: Extra inputs are not permitted"}
        assert school.count("teachers") == 0

    def test_more_rows_than_the_limit_are_refused_before_anything_is_imported(self, school):
        rows = [school.student_row() for _ in range(201)]

        response = school.post(STUDENTS, rows, "students", send_invite=False)

        assert response.status_code == 422
        assert school.count("students") == 0

    def test_an_empty_list_is_refused(self, school):
        assert school.post(STUDENTS, [], "students").status_code == 422


class TestTeachers:
    def test_every_given_field_is_saved(self, school):
        row = school.teacher_row(
            name_initials="rai", phone="9123456780", department_id=school.department_name,
            designation_id=school.designation_code.lower(),
        )

        assert school.teachers([row])["imported_count"] == 1

        saved = school.query(
            "SELECT name_initials, phone, department_id, designation_id FROM teachers WHERE tenant_id = %s AND employee_id = %s",
            school.tenant, row["employee_id"],
        )[0]
        assert saved == ("rai", "9123456780", school.department, school.designation)

    def test_a_row_without_department_or_designation_gets_one_shared_default(self, seed, client):
        empty = School(seed, client)
        seed.conn.cursor().execute("DELETE FROM batches WHERE tenant_id = %s", (empty.tenant,))
        seed.conn.cursor().execute("DELETE FROM departments WHERE tenant_id = %s", (empty.tenant,))
        seed.conn.cursor().execute("DELETE FROM designations WHERE tenant_id = %s", (empty.tenant,))

        result = empty.teachers([empty.teacher_row(), empty.teacher_row()])

        assert result["imported_count"] == 2
        assert empty.count("departments") == 1 and empty.count("designations") == 1

    def test_an_unknown_department_or_designation_is_refused(self, school):
        result = school.teachers([
            school.teacher_row(department_id="NOPE"),
            school.teacher_row(designation_id="NOPE"),
        ])

        assert reasons(result) == {1: "Department 'NOPE' not found.", 2: "Designation 'NOPE' not found."}

    def test_a_repeated_employee_id_is_refused(self, school):
        first = school.teacher_row()

        result = school.teachers([first, school.teacher_row(employee_id=first["employee_id"])])

        assert result["imported_count"] == 1
        assert reasons(result) == {2: f"Employee ID '{first['employee_id']}' already exists."}
