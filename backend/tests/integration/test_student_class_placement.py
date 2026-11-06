"""A student added to a batch that has a class is in that class at once, with its subjects and its semester."""
import uuid

import pytest

from tests.integration.institution import Institution

STUDENTS = "/api/v1/admin/users/student"
CLASSES = "/api/v1/admin/class-management/classes"


class Campus:
    """An institution with one department, two batches, one class on the first batch and two subjects."""

    def __init__(self, seed, client_):
        self.seed, self.client = seed, client_
        self.college = Institution(seed)
        tenant = self.college.tenant_id
        seed.conn.cursor().execute("UPDATE tenants SET license_count = 50 WHERE id = %s", (tenant,))
        self.department = seed.department(tenant)
        self.first_batch = self._batch("A", 1)
        self.second_batch = self._batch("B", 1)
        self.headers = self.college.sign_in(client_)
        teacher = seed.teacher(tenant)
        created = client_.post(
            CLASSES, headers=self.headers,
            json={"department_id": self.department, "batch_id": self.first_batch, "semester_number": 4},
        )
        assert created.status_code == 201, created.text
        self.class_id = created.json()["id"]
        for _ in range(2):
            subject = seed.insert("subjects", tenant_id=tenant, code=uuid.uuid4().hex[:6], name="Subject")
            added = client_.post(
                f"{CLASSES}/{self.class_id}/sections", headers=self.headers,
                json={"subject_id": subject, "primary_teacher_id": teacher},
            )
            assert added.status_code == 201, added.text

    def _batch(self, section, number) -> str:
        return self.seed.insert(
            "batches", tenant_id=self.college.tenant_id, department_id=self.department, section=section,
            number=number, code=f"X-{section}-{number}-{uuid.uuid4().hex[:4]}", status="ACTIVE",
        )

    def add_student(self, batch_id) -> dict:
        tag = uuid.uuid4().hex[:8]
        response = self.client.post(
            STUDENTS, headers=self.headers,
            json={
                "email": f"{tag}@example.com", "enrollment_number": tag, "first_name": "New", "last_name": "Student",
                "department_id": self.department, "batch_id": batch_id, "phone": "9876543210", "gender": "M",
                "date_of_birth": "2005-01-01T00:00:00", "send_invite": False,
            },
        )
        assert response.status_code == 201, response.text
        return response.json()

    def enrollments(self, student_id) -> int:
        with self.seed.conn.cursor() as cursor:
            cursor.execute(
                "SELECT count(*) FROM course_enrollments WHERE student_id = %s AND ended_at IS NULL AND status = 'ACTIVE'",
                (student_id,),
            )
            return cursor.fetchone()[0]

    def class_members(self) -> list[str]:
        detail = self.client.get(f"{CLASSES}/{self.class_id}", headers=self.headers).json()
        return [m["student_id"] for m in detail["members"]]


@pytest.fixture
def campus(seed, client):
    return Campus(seed, client)


def test_a_new_student_joins_the_class_of_their_batch(campus):
    student = campus.add_student(campus.first_batch)

    assert student["id"] in campus.class_members()
    assert campus.enrollments(student["id"]) == 2
    assert student["semester"] == 4


def test_the_semester_comes_from_the_class_and_follows_an_edit_of_it(campus):
    student = campus.add_student(campus.first_batch)
    campus.client.patch(f"{CLASSES}/{campus.class_id}", headers=campus.headers, json={"semester_number": 5})

    shown = campus.client.get(f"/api/v1/admin/users/students/{student['id']}", headers=campus.headers).json()

    assert shown["semester"] == 5


def test_a_batch_without_a_class_leaves_the_student_with_no_class_and_no_semester(campus):
    student = campus.add_student(campus.second_batch)

    assert student["id"] not in campus.class_members()
    assert campus.enrollments(student["id"]) == 0
    assert student["semester"] is None


def test_changing_the_batch_moves_the_student_out_of_the_old_class(campus):
    student = campus.add_student(campus.first_batch)

    moved = campus.client.put(
        f"/api/v1/admin/users/students/{student['id']}", headers=campus.headers,
        json={"batch_id": campus.second_batch},
    )

    assert moved.status_code == 200, moved.text
    assert student["id"] not in campus.class_members()
    assert campus.enrollments(student["id"]) == 0
    assert moved.json()["semester"] is None


def test_the_semester_filter_and_facets_follow_the_classes(campus):
    student = campus.add_student(campus.first_batch)
    listing = campus.client.get("/api/v1/admin/users/students", headers=campus.headers, params={"semester": 4}).json()
    facets = campus.client.get("/api/v1/admin/users/students/facets", headers=campus.headers).json()

    assert [s["id"] for s in listing["items"]] == [student["id"]]
    assert facets["semesters"] == [4]


def test_a_semester_cannot_be_sent_with_a_new_student(campus):
    response = campus.client.post(STUDENTS, headers=campus.headers, json={"semester": 3})

    assert response.status_code == 422


def test_students_imported_from_a_csv_join_the_class_of_their_batch(campus):
    with campus.seed.conn.cursor() as cursor:
        cursor.execute("SELECT code FROM batches WHERE id = %s", (campus.first_batch,))
        batch_code = cursor.fetchone()[0]
    tag = uuid.uuid4().hex[:8]
    row = {
        "email": f"{tag}@example.com", "enrollment_number": tag, "first_name": "Csv", "last_name": "Student",
        "department_id": campus.department, "batch_code": batch_code,
    }

    imported = campus.client.post(
        "/api/v1/admin/users/students/bulk", headers=campus.headers, json={"students": [row], "send_invite": False}
    )

    assert imported.json()["imported_count"] == 1, imported.text
    assert len(campus.class_members()) == 1
