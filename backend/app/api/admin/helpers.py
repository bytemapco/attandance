from functools import wraps
from fastapi import HTTPException, Request, status
from prisma.errors import PrismaError

from app.core.logging_config import get_logger
from app.db.client import db

logger = get_logger("app.api.admin")


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def handle_value_err(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except ValueError as err:
            err_msg = str(err)
            if "not found" in err_msg.lower():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        except PrismaError:
            raise
        except Exception as err:
            logger.error("Admin operation error: %s", err, exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

    return wrapper


def handle_generic_err(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            raise
        except ValueError as err:
            err_msg = str(err)
            if "not found" in err_msg.lower():
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=err_msg)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)
        except PrismaError:
            raise
        except Exception as err:
            logger.error("Admin generic operation error: %s", err, exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

    return wrapper


async def require_student_in_tenant(student_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.student.find_first(where={"id": student_id, "user": {"is": {"tenantId": tenant_id}}})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")


async def require_teacher_in_tenant(teacher_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.teacher.find_first(where={"id": teacher_id, "user": {"is": {"tenantId": tenant_id}}})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found.")


async def require_class_in_tenant(class_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.academicclass.find_first(where={"id": class_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")


async def require_department_in_tenant(department_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.department.find_first(where={"id": department_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found.")


async def require_subject_in_tenant(subject_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.subject.find_first(where={"id": subject_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found.")


async def require_classroom_in_tenant(classroom_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.classroom.find_first(where={"id": classroom_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Classroom not found.")


async def require_designation_in_tenant(designation_id: str, tenant_id: str) -> None:
    if not db.is_connected():
        return
    record = await db.designation.find_first(where={"id": designation_id, "tenantId": tenant_id})
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Designation not found.")
