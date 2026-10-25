from typing import Optional
from app.core.logging_config import get_logger
from app.core.security import hash_password, generate_temporary_password
from app.db.client import db
from app.schemas.teacher import TeacherCreate, TeacherResponse

logger = get_logger("app.services.admin.teacher")


def _check_db_connected(database) -> bool:
    is_conn = getattr(database, "is_connected", None)
    if is_conn is None:
        return True
    try:
        res = is_conn()
        if hasattr(res, "__await__"):
            res.close()
            return True
        return bool(res)
    except Exception:
        return True


class TeacherAdminService:
    @staticmethod
    async def create_teacher(data: TeacherCreate, tenant_id: Optional[str] = None, db_client=None) -> TeacherResponse:
        database = db_client or db
        if tenant_id and _check_db_connected(database):
            dept_where = {"id": data.department_id, "tenantId": tenant_id}
            if not await database.department.find_first(where=dept_where):
                raise ValueError(f"Department with id '{data.department_id}' not found.")
            desig_where = {"id": data.designation_id, "tenantId": tenant_id}
            if not await database.designation.find_first(where=desig_where):
                raise ValueError(f"Designation with id '{data.designation_id}' not found.")
        else:
            if not await database.department.find_unique(where={"id": data.department_id}):
                raise ValueError(f"Department with id '{data.department_id}' not found.")
            if not await database.designation.find_unique(where={"id": data.designation_id}):
                raise ValueError(f"Designation with id '{data.designation_id}' not found.")

        if tenant_id and _check_db_connected(database):
            tenant = await database.tenant.find_unique(where={"id": tenant_id})
            if tenant:
                current_count = await database.user.count(
                    where={"tenantId": tenant_id, "role": {"in": ["STUDENT", "TEACHER"]}}
                )
                if current_count >= tenant.licenseCount:
                    raise ValueError(
                        f"License seat quota exceeded ({current_count}/{tenant.licenseCount}). "
                        "Request additional licenses from your super administrator."
                    )

        plain_password = getattr(data, "password", None) or generate_temporary_password()
        must_change = not bool(getattr(data, "password", None))

        user_data = {
            "email": data.email,
            "hashedPassword": hash_password(plain_password),
            "role": "TEACHER",
            "mustChangePassword": must_change,
        }
        if tenant_id:
            user_data["tenantId"] = tenant_id

        user = await database.user.create(data=user_data)
        teacher_data = {
            k: v
            for k, v in {
                "userId": user.id,
                "employeeId": data.employee_id,
                "firstName": data.first_name,
                "lastName": data.last_name,
                "nameInitials": data.name_initials,
                "departmentId": data.department_id,
                "designationId": data.designation_id,
                "phone": data.phone,
            }.items()
            if v is not None
        }

        try:
            teacher = await database.teacher.create(data=teacher_data, include={"department": True, "designation": True})
        except Exception as exc:
            try:
                await database.user.delete(where={"id": user.id})
            except Exception as cleanup_exc:
                logger.error("Failed to rollback user %s after teacher creation failure: %s", user.id, cleanup_exc)
            raise exc

        if data.send_invite:
            try:
                from app.services.auth_service import AuthService
                from app.services.email_service import email_service

                name = f"{data.first_name or ''} {data.last_name or ''}".strip() or "Teacher"
                token = await AuthService().create_invitation_token(
                    user_id=user.id, email=user.email, role="TEACHER", name=name
                )
                sent = await email_service.send_invitation_email(
                    to_email=user.email,
                    recipient_name=name,
                    role="TEACHER",
                    invite_token=token,
                    identifier_label="Employee ID",
                    identifier_value=data.employee_id,
                    temp_password=plain_password if must_change else None,
                )
                if not sent:
                    logger.warning("Teacher invitation email was not sent (check SMTP settings) for %s", user.email)
            except Exception as e:
                logger.warning("Failed to send teacher invitation email: %s", e)

        return TeacherResponse(
            id=teacher.id,
            user_id=user.id,
            email=user.email,
            employee_id=teacher.employeeId,
            first_name=teacher.firstName,
            last_name=teacher.lastName,
            name_initials=teacher.nameInitials,
            department_id=teacher.departmentId,
            designation_id=teacher.designationId,
            department=teacher.department.name if teacher.department else "",
            designation=teacher.designation.name if teacher.designation else "",
            phone=teacher.phone,
            qualification=teacher.qualification,
            specialization=teacher.specialization,
            experience_years=teacher.experienceYears,
            joining_date=teacher.joiningDate,
        )

    @staticmethod
    async def get_all_teachers(
        page: int = 1,
        page_size: int = 10,
        sort_by: Optional[str] = None,
        sort_order: str = "asc",
        q: Optional[str] = None,
        department_id: Optional[str] = None,
        designation_id: Optional[str] = None,
        status: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> dict:
        where: dict = {}
        if tenant_id:
            where["user"] = {"is": {"tenantId": tenant_id}}
        if department_id and department_id != "all":
            where["departmentId"] = department_id
        if designation_id and designation_id != "all":
            where["designationId"] = designation_id
        if status and status.strip() and status != "all":
            is_active_val = status.lower() == "active"
            existing_user_where = where.get("user", {}).get("is", {})
            where["user"] = {"is": {**existing_user_where, "isActive": is_active_val}}

        if q and q.strip():
            query_str = q.strip()
            where["OR"] = [
                {"firstName": {"contains": query_str, "mode": "insensitive"}},
                {"lastName": {"contains": query_str, "mode": "insensitive"}},
                {"employeeId": {"contains": query_str, "mode": "insensitive"}},
                {"nameInitials": {"contains": query_str, "mode": "insensitive"}},
                {"user": {"is": {"email": {"contains": query_str, "mode": "insensitive"}}}},
            ]

        allowed_sorts = {
            "first_name": "firstName",
            "last_name": "lastName",
            "employee_id": "employeeId",
            "created_at": "createdAt",
            "experience_years": "experienceYears",
        }
        order_col = allowed_sorts.get(sort_by, "createdAt")
        order_dir = "desc" if sort_order.lower() == "desc" else "asc"

        total_items = await db.teacher.count(where=where)
        skip = (page - 1) * page_size
        teachers = await db.teacher.find_many(
            where=where,
            include={"user": True, "department": True, "designation": True},
            skip=skip,
            take=page_size,
            order={order_col: order_dir},
        )
        items = [
            TeacherResponse(
                id=t.id,
                user_id=t.userId,
                email=t.user.email if t.user else "",
                employee_id=t.employeeId,
                first_name=t.firstName,
                last_name=t.lastName,
                name_initials=t.nameInitials,
                department_id=t.departmentId,
                designation_id=t.designationId,
                department=t.department.name if t.department else "",
                designation=t.designation.name if t.designation else "",
                phone=t.phone,
                is_active=t.user.isActive if t.user else True,
            )
            for t in teachers
        ]
        total_pages = max(1, (total_items + page_size - 1) // page_size) if total_items > 0 else 1
        return {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }

    @staticmethod
    async def update_teacher(id: str, data: dict, tenant_id: Optional[str] = None) -> TeacherResponse:
        if tenant_id and db.is_connected():
            existing = await db.teacher.find_first(where={"id": id, "user": {"is": {"tenantId": tenant_id}}})
            if not existing:
                raise ValueError("Teacher not found.")

        if "department_id" in data and data["department_id"]:
            dept_where = {"id": data["department_id"]}
            if tenant_id:
                dept_where["tenantId"] = tenant_id
            if db.is_connected() and not await db.department.find_first(where=dept_where):
                raise ValueError("Department not found.")

        if "designation_id" in data and data["designation_id"]:
            desig_where = {"id": data["designation_id"]}
            if tenant_id:
                desig_where["tenantId"] = tenant_id
            if db.is_connected() and not await db.designation.find_first(where=desig_where):
                raise ValueError("Designation not found.")

        mapping = {
            "employee_id": "employeeId",
            "first_name": "firstName",
            "last_name": "lastName",
            "name_initials": "nameInitials",
            "department_id": "departmentId",
            "designation_id": "designationId",
            "phone": "phone",
        }
        update_data = {mapping[k]: v for k, v in data.items() if k in mapping}
        teacher = await db.teacher.update(
            where={"id": id}, data=update_data, include={"user": True, "department": True, "designation": True}
        )
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
        )
