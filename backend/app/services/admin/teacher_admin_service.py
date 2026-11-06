from typing import Optional

from app.db.client import db
from app.schemas.pagination import PaginatedResponse
from app.schemas.teacher import TeacherCreate, TeacherResponse
from app.services.admin.account_setup import (
    create_user_with_profile,
    initial_credentials,
    require_license_seat,
    require_record,
    user_record,
)
from app.services.invitations import send_invitation
from app.services.admin.listing import ordering, selected, text_search, with_account_status

SEARCH_COLUMNS = ("firstName", "lastName", "employeeId", "nameInitials")
SORT_COLUMNS = {
    "first_name": "firstName",
    "last_name": "lastName",
    "employee_id": "employeeId",
    "created_at": "createdAt",
    "experience_years": "experienceYears",
}
UPDATE_COLUMNS = {
    "employee_id": "employeeId",
    "first_name": "firstName",
    "last_name": "lastName",
    "name_initials": "nameInitials",
    "department_id": "departmentId",
    "designation_id": "designationId",
    "phone": "phone",
}
INCLUDE = {"user": True, "department": True, "designation": True}


def _response(teacher, invitation_sent: Optional[bool] = None) -> TeacherResponse:
    return TeacherResponse(
        id=teacher.id,
        user_id=teacher.userId,
        email=teacher.user.email if teacher.user else "",
        employee_id=teacher.employeeId,
        first_name=teacher.firstName,
        last_name=teacher.lastName,
        name_initials=teacher.nameInitials,
        department_id=teacher.departmentId,
        designation_id=teacher.designationId,
        department=teacher.department.name if teacher.department else "",
        designation=teacher.designation.name if teacher.designation else "",
        phone=teacher.phone,
        invitation_sent=invitation_sent,
        is_active=teacher.user.isActive if teacher.user else True,
    )


class TeacherAdminService:
    @staticmethod
    async def create_teacher(data: TeacherCreate, tenant_id: str) -> TeacherResponse:
        await require_record(
            db.department,
            {"id": data.department_id, "tenantId": tenant_id},
            f"Department with id '{data.department_id}' not found.",
        )
        await require_record(
            db.designation,
            {"id": data.designation_id, "tenantId": tenant_id},
            f"Designation with id '{data.designation_id}' not found.",
        )
        await require_license_seat(tenant_id)

        password, must_change = initial_credentials()
        profile = {
            "tenantId": tenant_id,
            "employeeId": data.employee_id,
            "firstName": data.first_name,
            "lastName": data.last_name,
            "nameInitials": data.name_initials,
            "departmentId": data.department_id,
            "designationId": data.designation_id,
            "phone": data.phone,
        }
        user, teacher = await create_user_with_profile(
            await user_record(data.email, "TEACHER", tenant_id, password, must_change),
            lambda user_id: db.teacher.create(
                data={"userId": user_id, **{k: v for k, v in profile.items() if v is not None}}, include=INCLUDE
            ),
        )

        invitation_sent: Optional[bool] = None
        if data.send_invite:
            name = f"{data.first_name} {data.last_name}".strip() or "Teacher"
            invitation_sent = await send_invitation(
                user.id, user.email, name, "TEACHER", "Employee ID", data.employee_id,
                temp_password=password if must_change else None,
            )
        return _response(teacher, invitation_sent)

    @staticmethod
    async def get_all_teachers(
        tenant_id: str,
        page: int = 1,
        page_size: int = 10,
        sort_by: Optional[str] = None,
        sort_order: str = "asc",
        q: Optional[str] = None,
        department_id: Optional[str] = None,
        designation_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> PaginatedResponse[TeacherResponse]:
        where: dict = {"user": {"is": {"tenantId": tenant_id}}}
        if selected(department_id):
            where["departmentId"] = department_id
        if selected(designation_id):
            where["designationId"] = designation_id
        with_account_status(where, status)
        search = text_search(q, SEARCH_COLUMNS)
        if search:
            where["OR"] = search

        total_items = await db.teacher.count(where=where)
        teachers = await db.teacher.find_many(
            where=where,
            include=INCLUDE,
            skip=(page - 1) * page_size,
            take=page_size,
            order=ordering(sort_by, sort_order, SORT_COLUMNS),
        )
        return PaginatedResponse.create([_response(t) for t in teachers], total_items, page, page_size)

    @staticmethod
    async def update_teacher(id: str, data: dict, tenant_id: str) -> TeacherResponse:
        await require_record(db.teacher, {"id": id, "user": {"is": {"tenantId": tenant_id}}}, "Teacher not found.")
        if data.get("department_id"):
            await require_record(
                db.department, {"id": data["department_id"], "tenantId": tenant_id}, "Department not found."
            )
        if data.get("designation_id"):
            await require_record(
                db.designation, {"id": data["designation_id"], "tenantId": tenant_id}, "Designation not found."
            )
        update_data = {UPDATE_COLUMNS[k]: v for k, v in data.items() if k in UPDATE_COLUMNS}
        teacher = await db.teacher.update(where={"id": id}, data=update_data, include=INCLUDE)
        return _response(teacher)
