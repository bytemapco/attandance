"""Adding one department, subject, classroom or designation that repeats one the institution has is refused."""
import pytest

ADMIN = "/api/v1/admin"


@pytest.mark.parametrize(
    "path, first, repeat",
    [
        ("departments", {"name": "Civil", "code": "CE"}, {"name": "Civil two", "code": "ce"}),
        ("subjects", {"name": "Maths", "code": "MA101"}, {"name": "Maths two", "code": "ma101"}),
        ("designations", {"name": "Professor", "code": "PROF"}, {"name": "Professor two", "code": "prof"}),
        ("classrooms", {"name": "Room 1"}, {"name": "room 1"}),
    ],
)
def test_repeating_a_record_is_a_409_whatever_its_case(school, client, path, first, repeat):
    created = client.post(f"{ADMIN}/{path}", json=first, headers=school.headers)
    assert created.status_code < 300, created.text

    again = client.post(f"{ADMIN}/{path}", json=repeat, headers=school.headers)

    assert again.status_code == 409
    assert "already exists" in again.json()["detail"]


def test_a_subject_in_a_department_that_does_not_exist_is_refused(school, client):
    response = client.post(
        f"{ADMIN}/subjects", json={"name": "Maths", "code": "MA101", "department_id": "NOPE"}, headers=school.headers
    )

    assert response.status_code == 404
    assert school.count("subjects") == 0


@pytest.mark.parametrize(
    "path, body",
    [
        ("departments", {"name": "Civil", "code": "CE", "head": "Dr. Rao"}),
        ("departments", {"name": "Civil", "code": "CE", "description": "Structures"}),
        ("subjects", {"name": "Maths", "code": "MA101", "description": "Core"}),
        ("designations", {"name": "Professor", "code": "PROF", "description": "Chair"}),
        ("classrooms", {"name": "Room 1", "building": "A"}),
    ],
)
def test_a_field_that_was_removed_is_refused_by_the_forms_too(school, client, path, body):
    assert client.post(f"{ADMIN}/{path}", json=body, headers=school.headers).status_code == 422
