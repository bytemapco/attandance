import re
from typing import Optional

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from prisma.errors import DataError, ForeignKeyViolationError, RecordNotFoundError, UniqueViolationError

from app.core.logging_config import get_logger

logger = get_logger("app.db_errors")

_HIDDEN_FIELDS = {"tenant_id"}


def _readable(name: str) -> str:
    return re.sub(r"_id$", "", name).replace("_", " ").strip()


def _unique_message(exc: Exception) -> str:
    fields = re.findall(r"`([^`]+)`", str(exc))
    shown = [_readable(f) for f in fields if f not in _HIDDEN_FIELDS]
    if not shown:
        return "A record with the same details already exists."
    return f"A record with the same {', '.join(shown)} already exists."


def _fk_table(exc: Exception) -> Optional[str]:
    match = re.search(r"`(\w+?)_(?:\w+?)_fkey", str(exc))
    return match.group(1).replace("_", " ") if match else None


def _foreign_key_message(exc: Exception, method: str) -> str:
    table = _fk_table(exc)
    if method == "DELETE":
        used_by = f" by {table}" if table else ""
        return f"This record cannot be deleted because it is still used{used_by}."
    return "A selected related record does not exist or was removed. Refresh and try again."


def _data_error_message(exc: Exception) -> str:
    text = str(exc)
    if "violates check constraint" in text:
        return "One of the values is outside the allowed range."
    if "invalid input value for enum" in text:
        return "One of the values is not an allowed option."
    return "One of the submitted values is invalid."


def _body(code: str, message: str) -> dict:
    return {"detail": message, "success": False, "error": {"code": code, "message": message}}


def _respond(request: Request, exc: Exception, http_status: int, code: str, message: str) -> JSONResponse:
    logger.warning("%s on %s %s: %s", code, request.method, request.url.path, exc)
    return JSONResponse(status_code=http_status, content=_body(code, message))


async def _unique(request: Request, exc: UniqueViolationError) -> JSONResponse:
    return _respond(request, exc, status.HTTP_409_CONFLICT, "DUPLICATE_RECORD", _unique_message(exc))


async def _foreign_key(request: Request, exc: ForeignKeyViolationError) -> JSONResponse:
    code = "RECORD_IN_USE" if request.method == "DELETE" else "INVALID_REFERENCE"
    http_status = status.HTTP_409_CONFLICT if request.method == "DELETE" else status.HTTP_400_BAD_REQUEST
    return _respond(request, exc, http_status, code, _foreign_key_message(exc, request.method))


async def _data(request: Request, exc: DataError) -> JSONResponse:
    return _respond(request, exc, status.HTTP_400_BAD_REQUEST, "INVALID_VALUE", _data_error_message(exc))


async def _not_found(request: Request, exc: RecordNotFoundError) -> JSONResponse:
    return _respond(request, exc, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "The requested record was not found.")


def register_db_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(UniqueViolationError, _unique)
    app.add_exception_handler(ForeignKeyViolationError, _foreign_key)
    app.add_exception_handler(DataError, _data)
    app.add_exception_handler(RecordNotFoundError, _not_found)
