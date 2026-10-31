from typing import Optional
from app.db.client import db
from app.schemas.super_admin import TenantDetailResponse, TenantResponse


class TenantQueryService:
    @staticmethod
    async def get_all_tenants(
        page: int = 1,
        page_size: int = 10,
        q: Optional[str] = None,
        status: Optional[str] = None,
        type: Optional[str] = None,
    ) -> dict:
        where: dict = {}
        if status and status != "all":
            where["status"] = status
        if type and type != "all":
            where["type"] = type
        if q and q.strip():
            query_str = q.strip()
            where["OR"] = [
                {"name": {"contains": query_str, "mode": "insensitive"}},
                {"slug": {"contains": query_str, "mode": "insensitive"}},
            ]

        total_items = await db.tenant.count(where=where)
        skip = (page - 1) * page_size
        tenants = await db.tenant.find_many(where=where, skip=skip, take=page_size, order={"createdAt": "desc"})

        items = []
        for t in tenants:
            student_count = await db.student.count(where={"user": {"is": {"tenantId": t.id}}})
            teacher_count = await db.teacher.count(where={"user": {"is": {"tenantId": t.id}}})
            class_count = await db.academicclass.count(where={"tenantId": t.id})
            items.append(
                TenantResponse(
                    id=t.id,
                    slug=t.slug,
                    name=t.name,
                    type=t.type,
                    status=t.status,
                    domain=t.domain,
                    license_count=t.licenseCount,
                    created_at=t.createdAt,
                    student_count=student_count,
                    teacher_count=teacher_count,
                    class_count=class_count,
                )
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
    async def get_tenant_by_id(tenant_id: str) -> TenantDetailResponse:
        t = await db.tenant.find_unique(where={"id": tenant_id})
        if not t:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")
        admin_users = await db.user.find_many(where={"tenantId": tenant_id, "role": "TENANT_ADMIN"})
        student_count = await db.student.count(where={"user": {"is": {"tenantId": t.id}}})
        teacher_count = await db.teacher.count(where={"user": {"is": {"tenantId": t.id}}})
        class_count = await db.academicclass.count(where={"tenantId": t.id})
        department_count = await db.department.count(where={"tenantId": t.id})
        subject_count = await db.subject.count(where={"tenantId": t.id})
        active_sessions_count = await db.session.count(
            where={"academicClass": {"is": {"tenantId": t.id}}, "isActive": True}
        )
        total_attendance_count = await db.attendance.count(
            where={"session": {"is": {"academicClass": {"is": {"tenantId": t.id}}}}}
        )

        return TenantDetailResponse(
            id=t.id,
            slug=t.slug,
            name=t.name,
            type=t.type,
            status=t.status,
            domain=t.domain,
            license_count=t.licenseCount,
            created_at=t.createdAt,
            config=t.config if isinstance(t.config, dict) else {},
            student_count=student_count,
            teacher_count=teacher_count,
            class_count=class_count,
            department_count=department_count,
            subject_count=subject_count,
            active_sessions_count=active_sessions_count,
            total_attendance_count=total_attendance_count,
            admin_users=[
                {"id": u.id, "email": u.email, "role": u.role, "is_active": u.isActive, "created_at": u.createdAt}
                for u in admin_users
            ],
        )
