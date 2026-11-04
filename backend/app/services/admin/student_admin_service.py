from typing import Optional

from app.core.logging_config import get_logger
from app.db.client import db
from app.schemas.pagination import PaginatedResponse
from app.schemas.student import StudentCreate, StudentResponse
from app.services.admin.account_setup import (
    create_user_with_profile,
    initial_credentials,
    require_license_seat,
    require_record,
    user_record,
)
from app.services.invitations import send_invitation
from app.services.admin.listing import ordering, selected, text_search, with_account_status
from app.services.batch_service import resolve_assignable_batch

logger = get_logger("app.services.admin.student")

SEARCH_COLUMNS = ("firstName", "lastName", "enrollmentNumber")
SORT_COLUMNS = {
    "first_name": "firstName",
    "last_name": "lastName",
    "enrollment_number": "enrollmentNumber",
    "created_at": "createdAt",
    "semester": "semester",
}
UPDATE_COLUMNS = {
    "enrollment_number": "enrollmentNumber",
    "first_name": "firstName",
    "last_name": "lastName",
    "phone": "phone",
    "gender": "gender",
    "date_of_birth": "dateOfBirth",
    "semester": "semester",
    "department_id": "departmentId",
}
INCLUDE = {"user": True, "department": True}


def _response(student, invitation_sent: Optional[bool] = None) -> StudentResponse:
    return StudentResponse(
        id=student.id,
        user_id=student.userId,
        enrollment_number=student.enrollmentNumber,
        email=student.user.email if student.user else "",
        first_name=student.firstName,
        last_name=student.lastName,
        phone=student.phone,
        gender=student.gender,
        date_of_birth=student.dateOfBirth,
        department_id=student.departmentId,
        department_name=student.department.name if student.department else "",
        semester=student.semester,
        batch=student.batch,
        batch_id=student.batchId,
        invitation_sent=invitation_sent,
        is_active=student.user.isActive if student.user else True,
    )


class StudentAdminService:
    @staticmethod
    async def create_student(data: StudentCreate, tenant_id: str) -> StudentResponse:
        await require_record(
            db.department, {"id": data.department_id, "tenantId": tenant_id}, "Department not found."
        )
        batch = await resolve_assignable_batch(tenant_id, data.batch_id, data.department_id)
        await require_license_seat(tenant_id)

        password, must_change = initial_credentials()
        profile = {
            "tenantId": tenant_id,
            "enrollmentNumber": data.enrollment_number,
            "firstName": data.first_name,
            "lastName": data.last_name,
            "phone": data.phone,
            "gender": data.gender,
            "dateOfBirth": data.date_of_birth,
            "semester": data.semester,
            "batchId": batch.id,
            "batch": batch.code,
            "departmentId": data.department_id,
        }
        user, student = await create_user_with_profile(
            user_record(data.email, "STUDENT", tenant_id, password, must_change),
            lambda user_id: db.student.create(
                data={"userId": user_id, **{k: v for k, v in profile.items() if v is not None}}, include=INCLUDE
            ),
        )

        invitation_sent: Optional[bool] = None
        if data.send_invite:
            name = f"{data.first_name} {data.last_name}".strip() or "Student"
            invitation_sent = await send_invitation(
                user.id, user.email, name, "STUDENT", "Enrollment Number", data.enrollment_number,
                temp_password=password if must_change else None,
            )
        return _response(student, invitation_sent)

    @staticmethod
    async def get_all_students(
        tenant_id: str,
        page: int = 1,
        page_size: int = 10,
        sort_by: Optional[str] = None,
        sort_order: str = "asc",
        q: Optional[str] = None,
        department_id: Optional[str] = None,
        semester: Optional[int] = None,
        batch_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> PaginatedResponse[StudentResponse]:
        where: dict = {"user": {"is": {"tenantId": tenant_id}}}
        if selected(department_id):
            where["departmentId"] = department_id
        if semester is not None and semester > 0:
            where["semester"] = semester
        if selected(batch_id):
            where["batchId"] = batch_id
        with_account_status(where, status)
        search = text_search(q, SEARCH_COLUMNS)
        if search:
            where["OR"] = search

        total_items = await db.student.count(where=where)
        students = await db.student.find_many(
            where=where,
            include=INCLUDE,
            skip=(page - 1) * page_size,
            take=page_size,
            order=ordering(sort_by, sort_order, SORT_COLUMNS),
        )
        return PaginatedResponse.create([_response(s) for s in students], total_items, page, page_size)

    @staticmethod
    async def update_student(id: str, data: dict, tenant_id: str) -> StudentResponse:
        existing = await require_record(
            db.student, {"id": id, "user": {"is": {"tenantId": tenant_id}}}, "Student not found."
        )
        if data.get("department_id"):
            await require_record(
                db.department, {"id": data["department_id"], "tenantId": tenant_id}, "Department not found."
            )
        update_data = {UPDATE_COLUMNS[k]: v for k, v in data.items() if k in UPDATE_COLUMNS}
        if "department_id" in data or "batch_id" in data:
            update_data.update(await StudentAdminService._batch_update_fields(existing, data, tenant_id))
        student = await db.student.update(where={"id": id}, data=update_data, include=INCLUDE)
        return _response(student)

    @staticmethod
    async def _batch_update_fields(current, data: dict, tenant_id: str) -> dict:
        department_id = data.get("department_id") or current.departmentId
        if "batch_id" in data:
            batch_id = data["batch_id"]
        else:
            batch_id = None if department_id != current.departmentId else current.batchId
        batch = await resolve_assignable_batch(tenant_id, batch_id, department_id)
        if batch is None:
            raise ValueError("Select a batch for this student's department.")
        return {"batchId": batch.id, "batch": batch.code}

    @staticmethod
    async def get_filter_facets(tenant_id: str) -> dict:
        try:
            rows = await db.query_raw(
                """
                SELECT DISTINCT s.semester as val
                FROM students s
                LEFT JOIN users u ON s.user_id = u.id
                WHERE (u.tenant_id = $1 OR s.tenant_id = $1)
                  AND s.semester IS NOT NULL AND s.semester > 0
                ORDER BY val ASC
                """,
                tenant_id,
            )
        except Exception as exc:
            logger.error("Error fetching student facets: %s", exc)
            return {"semesters": []}
        return {"semesters": [int(row["val"]) for row in rows if row.get("val") is not None]}
