from typing import Any, Dict, Optional
from app.db.client import db


class UserManagementService:
    @staticmethod
    async def get_all_users(
        page: int = 1,
        page_size: int = 20,
        q: Optional[str] = None,
        role: Optional[str] = None,
        tenant_id: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Dict[str, Any]:
        where: dict = {}
        if role and role != "ALL":
            where["role"] = role
        if tenant_id and tenant_id != "ALL":
            where["tenantId"] = tenant_id
        if is_active is not None:
            where["isActive"] = is_active
        if q and q.strip():
            query_str = q.strip()
            where["email"] = {"contains": query_str, "mode": "insensitive"}

        total_items = await db.user.count(where=where)
        skip = (page - 1) * page_size
        users = await db.user.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order={"createdAt": "desc"},
            include={"tenant": True, "student": True, "teacher": True},
        )

        items = []
        for u in users:
            first_name = None
            last_name = None
            identifier = None
            if u.student:
                first_name = u.student.firstName
                last_name = u.student.lastName
                identifier = u.student.enrollmentNumber
            elif u.teacher:
                first_name = u.teacher.firstName
                last_name = u.teacher.lastName
                identifier = u.teacher.employeeId

            items.append(
                {
                    "id": u.id,
                    "email": u.email,
                    "role": u.role,
                    "is_active": u.isActive,
                    "tenant_id": u.tenantId,
                    "tenant_name": u.tenant.name if u.tenant else None,
                    "tenant_slug": u.tenant.slug if u.tenant else None,
                    "first_name": first_name,
                    "last_name": last_name,
                    "identifier": identifier,
                    "created_at": u.createdAt,
                }
            )

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
    async def set_user_status(user_id: str, is_active: bool, actor: str = "super_admin") -> Dict[str, Any]:
        u = await db.user.find_unique(where={"id": user_id})
        if not u:
            raise ValueError(f"User '{user_id}' not found.")
        updated = await db.user.update(where={"id": user_id}, data={"isActive": is_active})
        await db.auditlog.create(
            data={
                "eventType": "UPDATE_USER_STATUS",
                "severity": "WARNING" if not is_active else "INFO",
                "actor": actor,
                "target": user_id,
                "tenantId": u.tenantId,
                "description": f"Super admin set user {u.email} active={is_active}",
            }
        )
        return {"id": updated.id, "email": updated.email, "is_active": updated.isActive}

    @staticmethod
    async def trigger_password_reset(
        user_id: str, actor: str = "super_admin", frontend_url: Optional[str] = None
    ) -> Dict[str, Any]:
        u = await db.user.find_unique(where={"id": user_id})
        if not u:
            raise ValueError(f"User '{user_id}' not found.")
        from app.services.auth_service import AuthService

        await AuthService().request_password_reset(u.email, frontend_url=frontend_url)
        await db.auditlog.create(
            data={
                "eventType": "TRIGGER_PASSWORD_RESET",
                "severity": "WARNING",
                "actor": actor,
                "target": user_id,
                "tenantId": u.tenantId,
                "description": f"Super admin dispatched password reset email for user {u.email}",
            }
        )
        return {"id": u.id, "email": u.email, "status": "password_reset_email_dispatched"}
