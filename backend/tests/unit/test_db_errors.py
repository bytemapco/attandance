import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from prisma.errors import DataError, ForeignKeyViolationError, RecordNotFoundError, UniqueViolationError

from app.core.db_errors import register_db_error_handlers


def prisma_error(cls, message):
    error = cls.__new__(cls)
    Exception.__init__(error, message)
    return error


def client_raising(error):
    app = FastAPI()
    register_db_error_handlers(app)

    @app.api_route("/thing", methods=["GET", "POST", "DELETE"])
    async def thing():
        raise error

    return TestClient(app, raise_server_exceptions=False)


def test_a_unique_violation_is_a_409_naming_the_field_but_not_the_tenant():
    error = prisma_error(UniqueViolationError, "Unique constraint failed on the fields: (`tenant_id`,`enrollment_number`)")

    response = client_raising(error).post("/thing")

    assert response.status_code == 409
    body = response.json()
    assert body["error"]["code"] == "DUPLICATE_RECORD"
    assert "enrollment number" in body["detail"] and "tenant" not in body["detail"]
    assert body["success"] is False


def test_a_unique_violation_without_field_names_has_a_generic_message():
    response = client_raising(prisma_error(UniqueViolationError, "boom")).post("/thing")
    assert response.json()["detail"] == "A record with the same details already exists."


def test_deleting_a_record_that_is_in_use_is_a_409():
    error = prisma_error(ForeignKeyViolationError, "Foreign key constraint violated: `course_sections_subject_id_fkey`")

    response = client_raising(error).delete("/thing")

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "RECORD_IN_USE"


def test_saving_a_bad_reference_is_a_400():
    error = prisma_error(ForeignKeyViolationError, "Foreign key constraint violated")

    response = client_raising(error).post("/thing")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_REFERENCE"


@pytest.mark.parametrize(
    "message, expected",
    [
        ('new row violates check constraint "x"', "outside the allowed range"),
        ("invalid input value for enum Role", "not an allowed option"),
        ("something else", "is invalid"),
    ],
)
def test_data_errors_are_a_400_with_a_readable_message(message, expected):
    response = client_raising(prisma_error(DataError, message)).post("/thing")

    assert response.status_code == 400
    assert expected in response.json()["detail"]


def test_a_missing_record_is_a_404():
    response = client_raising(prisma_error(RecordNotFoundError, "none")).get("/thing")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"
