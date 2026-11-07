"""Checking one spreadsheet row, and running an import over many rows, with no database."""
from datetime import date

import pytest

from app.schemas.admin.bulk import ClassroomBulkItem, DepartmentBulkItem, StudentBulkItem, TeacherBulkItem
from app.services.admin import bulk_import_common as common
from app.services.admin.bulk_import_common import Invite, RowRejected, check_row, run_import

STUDENT = {
    "email": "asha@example.com", "enrollment_number": "EN001", "first_name": "Asha", "last_name": "Rao",
    "department_id": "CE",
}


def problems(model, raw) -> str:
    with pytest.raises(RowRejected) as refused:
        check_row(model, raw)
    return str(refused.value)


class TestCheckRow:
    def test_text_is_trimmed_and_the_email_is_lowercased(self):
        item = check_row(StudentBulkItem, {**STUDENT, "email": " Asha@Example.COM ", "first_name": "  Asha  "})

        assert (item.email, item.first_name) == ("asha@example.com", "Asha")

    def test_a_blank_cell_counts_as_not_given(self):
        item = check_row(StudentBulkItem, {**STUDENT, "phone": "   ", "batch_code": ""})

        assert item.phone is None and item.batch_code is None

    def test_a_blank_required_cell_is_reported_as_required(self):
        assert problems(StudentBulkItem, {**STUDENT, "last_name": " "}) == "last name is required"

    def test_the_department_and_designation_are_named_without_the_id_suffix(self):
        assert problems(StudentBulkItem, {k: v for k, v in STUDENT.items() if k != "department_id"}) == "department is required"
        too_long = {"email": "a@b.in", "employee_id": "EM001", "first_name": "R", "last_name": "I", "designation_id": "x" * 101}
        assert problems(TeacherBulkItem, too_long).startswith("designation: ")

    def test_every_wrong_field_is_named_in_one_message(self):
        message = problems(StudentBulkItem, {**STUDENT, "email": "nope", "enrollment_number": "E"})

        assert message.count(";") == 1 and "email" in message and "enrollment number" in message

    def test_a_field_the_import_does_not_know_is_refused(self):
        assert problems(TeacherBulkItem, {"email": "a@b.in", "employee_id": "EM001", "first_name": "R", "last_name": "I", "qualification": "PhD"}) == (
            "qualification: Extra inputs are not permitted"
        )

    def test_a_date_of_birth_is_read_as_a_date(self):
        assert check_row(StudentBulkItem, {**STUDENT, "date_of_birth": "2005-04-12"}).date_of_birth == date(2005, 4, 12)

    @pytest.mark.parametrize("value", ["31/02/2005", "2005-13-01", "yesterday"])
    def test_an_impossible_date_is_refused(self, value):
        assert problems(StudentBulkItem, {**STUDENT, "date_of_birth": value}).startswith("date of birth")

    def test_gender_is_one_of_m_f_o(self):
        assert problems(StudentBulkItem, {**STUDENT, "gender": "X"}).startswith("gender")

    def test_a_row_that_is_not_an_object_is_refused(self):
        assert problems(ClassroomBulkItem, "Room 101").startswith("row")

    @pytest.mark.parametrize("raw", [{"name": "A", "code": "AB"}, {"name": "Ab", "code": "C"}])
    def test_a_department_needs_a_name_and_code_of_two_letters(self, raw):
        with pytest.raises(RowRejected):
            check_row(DepartmentBulkItem, raw)


@pytest.fixture
def delivered(monkeypatch):
    """Records the invitations the import would send, and reports them all as sent."""
    sent: list[Invite] = []

    async def deliver(invites):
        sent.extend(invites)
        return len(invites), []

    monkeypatch.setattr(common, "deliver_invites", deliver)
    return sent


def invite_for(item, row) -> Invite:
    return Invite(row, f"user-{row}", item.email, item.first_name, "STUDENT", "Enrollment Number", item.enrollment_number, None)


class TestRunImport:
    async def test_a_refused_row_is_reported_and_the_others_still_import(self, delivered):
        async def import_row(item, row):
            if item.enrollment_number == "EN002":
                raise RowRejected("Enrollment 'EN002' already exists.")
            return invite_for(item, row)

        rows = [STUDENT, {**STUDENT, "enrollment_number": "EN002"}, {**STUDENT, "enrollment_number": "EN003"}]
        result = await run_import(rows, StudentBulkItem, import_row, send_invite=True)

        assert (result["imported_count"], result["failed_count"]) == (2, 1)
        assert result["failures"] == [{"row": 2, "message": "Enrollment 'EN002' already exists."}]
        assert result["errors"] == ["Row 2: Enrollment 'EN002' already exists."]

    async def test_a_row_that_fails_the_check_never_reaches_the_import(self, delivered):
        reached = []

        async def import_row(item, row):
            reached.append(row)

        result = await run_import([STUDENT, {**STUDENT, "email": "nope"}], StudentBulkItem, import_row)

        assert reached == [1] and [f["row"] for f in result["failures"]] == [2]

    async def test_a_services_value_error_is_a_refusal_with_its_own_wording(self, delivered):
        async def import_row(item, row):
            raise ValueError("Department code 'CE' already exists.")

        result = await run_import([STUDENT], StudentBulkItem, import_row)

        assert result["failures"] == [{"row": 1, "message": "Department code 'CE' already exists."}]

    async def test_an_unexpected_error_names_the_row_and_does_not_stop_the_import(self, delivered):
        async def import_row(item, row):
            if row == 1:
                raise RuntimeError("database is down")

        result = await run_import([STUDENT, {**STUDENT, "enrollment_number": "EN002"}], StudentBulkItem, import_row)

        assert result["imported_count"] == 1
        assert result["failures"] == [{"row": 1, "message": "asha@example.com: database is down"}]

    async def test_invitations_go_only_to_imported_rows_when_asked(self, delivered):
        async def import_row(item, row):
            if row == 2:
                raise RowRejected("no")
            return invite_for(item, row)

        rows = [STUDENT, {**STUDENT, "enrollment_number": "EN002"}, {**STUDENT, "enrollment_number": "EN003"}]
        result = await run_import(rows, StudentBulkItem, import_row, send_invite=True)

        assert [invite.row for invite in delivered] == [1, 3] and result["invitations_sent"] == 2

    async def test_no_invitation_is_sent_when_not_asked(self, delivered):
        async def import_row(item, row):
            return invite_for(item, row)

        result = await run_import([STUDENT], StudentBulkItem, import_row, send_invite=False)

        assert delivered == [] and result["invitations_sent"] == 0

    async def test_an_invitation_that_could_not_be_sent_is_reported_but_the_row_stays_imported(self, monkeypatch):
        async def deliver(invites):
            return 0, ["Row 1: account created, but invitation email delivery failed. Check SMTP settings."]

        monkeypatch.setattr(common, "deliver_invites", deliver)

        async def import_row(item, row):
            return invite_for(item, row)

        result = await run_import([STUDENT], StudentBulkItem, import_row, send_invite=True)

        assert (result["imported_count"], result["failed_count"], result["failures"]) == (1, 0, [])
        assert result["errors"] == ["Row 1: account created, but invitation email delivery failed. Check SMTP settings."]

    async def test_rows_are_numbered_from_one_in_the_order_given(self, delivered):
        seen = []

        async def import_row(item, row):
            seen.append((row, item.name))

        await run_import([{"name": "A1"}, {"name": "B2"}, {"name": "C3"}], ClassroomBulkItem, import_row)

        assert seen == [(1, "A1"), (2, "B2"), (3, "C3")]
