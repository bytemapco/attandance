import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from prisma.errors import DataError, ForeignKeyViolationError, RecordNotFoundError, UniqueViolationError

from app.core.db_errors import register_db_error_handlers

_ERRORS = {
    "unique": UniqueViolationError({"user_facing_error": {"message": "Unique constraint failed on the fields: (`tenant_id`,`code`)"}}),
    "fk": ForeignKeyViolationError({"user_facing_error": {"message": "Foreign key constraint failed on the field: `teachers_department_id_fkey (index)`"}}),
    "check": DataError({"user_facing_error": {"message": 'violates check constraint "students_semester_range_chk"'}}),
    "missing": RecordNotFoundError({"user_facing_error": {"message": "not found"}}),
}


def _app() -> FastAPI:
    app = FastAPI()
    register_db_error_handlers(app)

    @app.post("/boom/{kind}")
    @app.delete("/boom/{kind}")
    async def boom(kind: str) -> None:
        raise _ERRORS[kind]

    return app


async def _call(method: str, kind: str):
    async with AsyncClient(transport=ASGITransport(app=_app()), base_url="http://t") as client:
        return await client.request(method, f"/boom/{kind}")


@pytest.mark.anyio
async def test_unique_violation_is_409_and_hides_tenant_field() -> None:
    res = await _call("POST", "unique")
    assert res.status_code == 409
    assert res.json()["detail"] == "A record with the same code already exists."
    assert res.json()["error"]["code"] == "DUPLICATE_RECORD"


@pytest.mark.anyio
async def test_foreign_key_on_delete_is_409_in_use() -> None:
    res = await _call("DELETE", "fk")
    assert res.status_code == 409
    assert "still used by teachers" in res.json()["detail"]


@pytest.mark.anyio
async def test_foreign_key_on_write_is_400() -> None:
    res = await _call("POST", "fk")
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "INVALID_REFERENCE"


@pytest.mark.anyio
async def test_check_constraint_is_400() -> None:
    res = await _call("POST", "check")
    assert res.status_code == 400
    assert "outside the allowed range" in res.json()["detail"]


@pytest.mark.anyio
async def test_record_not_found_is_404() -> None:
    assert (await _call("POST", "missing")).status_code == 404
