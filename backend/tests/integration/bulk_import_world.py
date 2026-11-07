"""An institution with a signed-in administrator, and the helpers the bulk import tests share."""
import uuid

from tests.integration.institution import Institution

ADMIN = "/api/v1/admin"
STUDENTS = f"{ADMIN}/users/students/bulk"
TEACHERS = f"{ADMIN}/users/teachers/bulk"
DEPARTMENTS = f"{ADMIN}/departments/bulk"
SUBJECTS = f"{ADMIN}/subjects/bulk"
CLASSROOMS = f"{ADMIN}/classrooms/bulk"
DESIGNATIONS = f"{ADMIN}/designations/bulk"


def tag() -> str:
    return uuid.uuid4().hex[:8]


class School:
    """An institution with one department, one designation and one active batch, and a signed-in administrator."""

    def __init__(self, seed, client):
        self.seed, self.client = seed, client
        college = Institution(seed)
        self.tenant = college.tenant_id
        self.set_licenses(50)
        self.headers = college.sign_in(client)
        self.department_code = f"D{tag()}".upper()
        self.department_name = f"Department {tag()}"
        self.department = seed.insert(
            "departments", tenant_id=self.tenant, code=self.department_code, name=self.department_name
        )
        self.designation_code = f"G{tag()}".upper()
        self.designation = seed.insert(
            "designations", tenant_id=self.tenant, code=self.designation_code, name=f"Designation {tag()}"
        )
        self.batch_code = f"B-{tag()}"
        self.batch = seed.insert(
            "batches", tenant_id=self.tenant, department_id=self.department, section="A", number=1,
            code=self.batch_code, status="ACTIVE",
        )

    def set_licenses(self, count: int) -> None:
        self.seed.conn.cursor().execute("UPDATE tenants SET license_count = %s WHERE id = %s", (count, self.tenant))

    def post(self, path: str, rows: list[dict], key: str, **extra):
        return self.client.post(path, headers=self.headers, json={key: rows, **extra})

    def run(self, path: str, rows: list[dict], key: str, **extra) -> dict:
        response = self.post(path, rows, key, **extra)
        assert response.status_code == 200, response.text
        return response.json()

    def students(self, rows: list[dict]) -> dict:
        return self.run(STUDENTS, rows, "students", send_invite=False)

    def teachers(self, rows: list[dict]) -> dict:
        return self.run(TEACHERS, rows, "teachers", send_invite=False)

    def query(self, sql: str, *params) -> list[tuple]:
        with self.seed.conn.cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchall()

    def count(self, table: str) -> int:
        return self.query(f"SELECT count(*) FROM {table} WHERE tenant_id = %s", self.tenant)[0][0]

    def student_row(self, **changes) -> dict:
        unique = tag()
        row = {
            "email": f"{unique}@example.com", "enrollment_number": f"EN{unique}", "first_name": "Asha",
            "last_name": "Rao", "department_id": self.department_code,
        }
        return {**row, **changes}

    def teacher_row(self, **changes) -> dict:
        unique = tag()
        row = {"email": f"{unique}@example.com", "employee_id": f"EM{unique}", "first_name": "Ravi", "last_name": "Iyer"}
        return {**row, **changes}


def reasons(result: dict) -> dict[int, str]:
    return {failure["row"]: failure["message"] for failure in result["failures"]}
