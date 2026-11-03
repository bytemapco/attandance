from functools import wraps
from typing import Any

from fastapi import HTTPException, status
from prisma.errors import PrismaError

from app.core.logging_config import get_logger
from app.db.client import db

logger = get_logger("app.api.admin")


def handle_generic_err(func):
    """Reports a service's ValueError as 404 (when it says "not found") or 400, and anything unexpected as 500."""

    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except ValueError as err:
            code = status.HTTP_404_NOT_FOUND if "not found" in str(err).lower() else status.HTTP_400_BAD_REQUEST
            raise HTTPException(status_code=code, detail=str(err))
        except PrismaError:
            raise
        except Exception as err:
            logger.error("Admin generic operation error: %s", err, exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

    return wrapper


async def _require_in_tenant(delegate: Any, where: dict, label: str) -> None:
    if not await delegate.find_first(where=where):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found.")


async def require_department_in_tenant(department_id: str, tenant_id: str) -> None:
    await _require_in_tenant(db.department, {"id": department_id, "tenantId": tenant_id}, "Department")


async def require_subject_in_tenant(subject_id: str, tenant_id: str) -> None:
    await _require_in_tenant(db.subject, {"id": subject_id, "tenantId": tenant_id}, "Subject")


async def require_classroom_in_tenant(classroom_id: str, tenant_id: str) -> None:
    await _require_in_tenant(db.classroom, {"id": classroom_id, "tenantId": tenant_id}, "Classroom")


async def require_designation_in_tenant(designation_id: str, tenant_id: str) -> None:
    await _require_in_tenant(db.designation, {"id": designation_id, "tenantId": tenant_id}, "Designation")
