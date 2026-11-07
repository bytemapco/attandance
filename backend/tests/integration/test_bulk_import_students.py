"""Student bulk import: every field is kept and each refused row says why."""
from tests.integration.bulk_import_world import STUDENTS, reasons


class TestStudents:
    def test_every_given_field_is_saved(self, school):
        row = school.student_row(
            phone="9876543210", gender="F", date_of_birth="2005-04-12", batch_code=school.batch_code
        )

        assert school.students([row])["imported_count"] == 1

        saved = school.query(
            "SELECT phone, gender::text, date_of_birth::text, batch_id, batch, department_id, first_name, last_name "
            "FROM students WHERE tenant_id = %s AND enrollment_number = %s",
            school.tenant, row["enrollment_number"],
        )[0]
        assert saved == ("9876543210", "F", "2005-04-12", school.batch, school.batch_code, school.department, "Asha", "Rao")

    def test_text_is_trimmed_and_the_email_is_lowercased(self, school):
        row = school.student_row(email="  Asha.RAO@Example.com ", enrollment_number="  EN-777 ", first_name=" Asha ")

        school.students([row])

        saved = school.query(
            "SELECT s.enrollment_number, s.first_name, u.email FROM students s JOIN users u ON u.id = s.user_id "
            "WHERE s.tenant_id = %s",
            school.tenant,
        )[0]
        assert saved == ("EN-777", "Asha", "asha.rao@example.com")

    def test_a_department_can_be_named_by_code_or_by_name_in_any_case(self, school):
        rows = [
            school.student_row(department_id=school.department_code.lower()),
            school.student_row(department_id=school.department_name.upper()),
            school.student_row(department_id=school.department),
        ]

        assert school.students(rows)["imported_count"] == 3

    def test_an_unknown_department_or_batch_is_refused(self, school):
        result = school.students([
            school.student_row(department_id="NOPE"),
            school.student_row(batch_code="NO-SUCH-BATCH"),
        ])

        assert reasons(result) == {
            1: "Department 'NOPE' not found.",
            2: "Active batch 'NO-SUCH-BATCH' not found in this department.",
        }

    def test_a_closed_batch_is_refused(self, school):
        school.seed.conn.cursor().execute("UPDATE batches SET status = 'ARCHIVED' WHERE id = %s", (school.batch,))

        result = school.students([school.student_row(batch_code=school.batch_code)])

        assert result["imported_count"] == 0 and "Active batch" in reasons(result)[1]

    def test_the_same_enrollment_or_email_twice_in_one_file_imports_only_the_first(self, school):
        first = school.student_row()
        rows = [first, school.student_row(enrollment_number=first["enrollment_number"]), school.student_row(email=first["email"])]

        result = school.students(rows)

        assert result["imported_count"] == 1
        assert reasons(result)[2] == f"Enrollment '{first['enrollment_number']}' already exists."
        assert reasons(result)[3] == f"Email '{first['email']}' already registered."

    def test_importing_the_same_file_again_adds_nothing(self, school):
        rows = [school.student_row(), school.student_row()]
        school.students(rows)

        again = school.students(rows)

        assert (again["imported_count"], again["failed_count"]) == (0, 2)
        assert school.count("students") == 2

    def test_an_impossible_date_or_gender_is_refused(self, school):
        result = school.students([school.student_row(date_of_birth="31/02/2005"), school.student_row(gender="X")])

        assert set(reasons(result)) == {1, 2}
        assert "date of birth" in reasons(result)[1] and "gender" in reasons(result)[2]

    def test_the_licence_limit_stops_the_whole_import(self, school):
        school.set_licenses(1)

        response = school.post(STUDENTS, [school.student_row(), school.student_row()], "students", send_invite=False)

        assert response.status_code == 400 and "license capacity" in response.json()["detail"]
        assert school.count("students") == 0

    def test_a_department_of_another_institution_is_not_found(self, school, seed):
        other = seed.department(seed.tenant())
        code = school.query("SELECT code FROM departments WHERE id = %s", other)[0][0]

        result = school.students([school.student_row(department_id=code)])

        assert reasons(result) == {1: f"Department '{code}' not found."}

    def test_the_import_is_written_to_the_audit_log(self, school):
        school.students([school.student_row(), school.student_row()])

        logged = school.query(
            "SELECT description FROM audit_logs WHERE tenant_id = %s AND event_type = 'BULK_IMPORT_STUDENTS'", school.tenant
        )
        assert logged == [("Bulk imported 2 students",)]

    def test_nothing_is_logged_when_nothing_was_imported(self, school):
        school.students([school.student_row(department_id="NOPE")])

        assert school.query("SELECT count(*) FROM audit_logs WHERE tenant_id = %s AND event_type = 'BULK_IMPORT_STUDENTS'", school.tenant) == [(0,)]
