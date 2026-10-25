import asyncio
import math
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from prisma import Json
from app.core.logging_config import get_logger
from app.db.client import db
from app.core.security import hash_password, generate_temporary_password
from app.schemas.super_admin import (
    TenantProvisionRequest,
    TenantUpdateRequest,
    TenantResponse,
    TenantDetailResponse,
    SuperAdminStatsResponse,
)

logger = get_logger("app.super_admin")


class SuperAdminService:
    @staticmethod
    async def provision_tenant(data: TenantProvisionRequest, actor: str = "super_admin") -> TenantDetailResponse:
        existing = await db.tenant.find_unique(where={"slug": data.slug})
        if existing:
            raise ValueError(f"Tenant slug '{data.slug}' is already taken.")

        # Consolidate admin accounts to create
        admins_to_create = []
        if data.admins and len(data.admins) > 0:
            for admin_entry in data.admins:
                clean_email = admin_entry.email.strip().lower()
                clean_name = admin_entry.name.strip()
                role = admin_entry.role or "TENANT_ADMIN"
                admins_to_create.append({"name": clean_name, "email": clean_email, "role": role})
        elif data.admin_email and data.admin_name:
            admins_to_create.append(
                {"name": data.admin_name.strip(), "email": data.admin_email.strip().lower(), "role": "TENANT_ADMIN"}
            )
        else:
            raise ValueError("At least one administrator (name and email) is required.")

        # Ensure no duplicate emails within request or database
        seen_emails = set()
        for a in admins_to_create:
            if a["email"] in seen_emails:
                raise ValueError(f"Duplicate email '{a['email']}' in administrator list.")
            seen_emails.add(a["email"])
            if await db.user.find_unique(where={"email": a["email"]}):
                raise ValueError(f"Admin email '{a['email']}' is already registered.")

        default_config = {
            "isFaceRecognitionEnabled": True,
            "isGpsVerificationEnabled": True,
            "isAiBackgroundValidationEnabled": True,
            "geofenceRadiusMeters": 50,
        }
        if data.config:
            default_config.update(data.config)

        tenant = await db.tenant.create(
            data={
                "name": data.name,
                "slug": data.slug,
                "type": data.type,
                "domain": data.domain,
                "licenseCount": data.license_count,
                "config": Json(default_config),
                "status": "ACTIVE",
            }
        )

        created_admin_users = []
        for a in admins_to_create:
            plain_pwd = data.admin_password or generate_temporary_password()
            must_change = not bool(data.admin_password)

            admin_user = await db.user.create(
                data={
                    "email": a["email"],
                    "hashedPassword": hash_password(plain_pwd),
                    "role": a["role"],
                    "mustChangePassword": must_change,
                    "tenantId": tenant.id,
                }
            )
            created_admin_users.append(
                {
                    "id": admin_user.id,
                    "email": admin_user.email,
                    "role": admin_user.role,
                    "name": a["name"],
                    "plain_pwd": plain_pwd,
                    "must_change": must_change,
                }
            )

        await db.systemconfiguration.create(
            data={
                "tenantId": tenant.id,
                "isFaceRecognitionEnabled": default_config["isFaceRecognitionEnabled"],
                "isGpsVerificationEnabled": default_config["isGpsVerificationEnabled"],
                "isAiBackgroundValidationEnabled": default_config["isAiBackgroundValidationEnabled"],
            }
        )

        try:
            from app.db.redis import get_redis

            r = get_redis()
            await r.setex(f"tenant:resolved:{tenant.slug}", 3600, tenant.id)
            if tenant.domain:
                await r.setex(f"tenant:resolved:{tenant.domain.lower()}", 3600, tenant.id)
        except Exception as cache_err:
            logger.warning("Failed to cache tenant resolution in Redis for %s: %s", tenant.slug, cache_err)

        try:
            from app.services.auth_service import AuthService
            from app.services.email_service import email_service

            auth_svc = AuthService()
            for created_admin in created_admin_users:
                token = await auth_svc.create_invitation_token(
                    user_id=created_admin["id"],
                    email=created_admin["email"],
                    role=created_admin["role"],
                    name=created_admin["name"],
                )
                admin_email = created_admin["email"]
                invite_task = asyncio.create_task(
                    email_service.send_invitation_email(
                        to_email=admin_email,
                        recipient_name=created_admin["name"],
                        role=created_admin["role"],
                        invite_token=token,
                        identifier_label="Tenant Slug",
                        identifier_value=tenant.slug,
                        temp_password=created_admin["plain_pwd"] if created_admin["must_change"] else None,
                    )
                )

                def _create_admin_done_cb(email_addr: str):
                    def _cb(t: asyncio.Task):
                        try:
                            sent = t.result()
                            if not sent:
                                logger.warning("Admin invitation email was not sent for %s (check SMTP settings)", email_addr)
                        except Exception as exc:
                            logger.error("Failed sending admin invitation email for %s: %s", email_addr, exc)
                    return _cb

                invite_task.add_done_callback(_create_admin_done_cb(admin_email))
        except Exception as mail_err:
            logger.warning("Failed preparing admin invitation tokens for tenant %s: %s", tenant.slug, mail_err)

        await db.auditlog.create(
            data={
                "eventType": "PROVISION_TENANT",
                "severity": "INFO",
                "actor": actor,
                "target": tenant.id,
                "description": f"Provisioned tenant {tenant.name} ({tenant.slug}) with {len(created_admin_users)} admin(s)",
            }
        )

        return TenantDetailResponse(
            id=tenant.id,
            slug=tenant.slug,
            name=tenant.name,
            type=tenant.type,
            status=tenant.status,
            domain=tenant.domain,
            license_count=tenant.licenseCount,
            created_at=tenant.createdAt,
            config=default_config,
            admin_users=[{"id": u["id"], "email": u["email"], "role": u["role"]} for u in created_admin_users],
        )

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

    @staticmethod
    async def add_tenant_admin(tenant_id: str, data: Dict[str, Any], actor: str = "super_admin") -> Dict[str, Any]:
        t = await db.tenant.find_unique(where={"id": tenant_id})
        if not t:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        email = data["email"].strip().lower()
        if await db.user.find_unique(where={"email": email}):
            raise ValueError(f"User with email '{email}' is already registered.")

        role = data.get("role") or "TENANT_ADMIN"
        name = data.get("name", "Administrator").strip()
        plain_pwd = generate_temporary_password()

        user = await db.user.create(
            data={
                "email": email,
                "hashedPassword": hash_password(plain_pwd),
                "role": role,
                "mustChangePassword": True,
                "tenantId": tenant_id,
            }
        )

        try:
            from app.services.auth_service import AuthService
            from app.services.email_service import email_service

            auth_svc = AuthService()
            token = await auth_svc.create_invitation_token(
                user_id=user.id,
                email=user.email,
                role=user.role,
                name=name,
            )
            invite_task = asyncio.create_task(
                email_service.send_invitation_email(
                    to_email=user.email,
                    recipient_name=name,
                    role=user.role,
                    invite_token=token,
                    identifier_label="Tenant Slug",
                    identifier_value=t.slug,
                )
            )

            def _admin_added_cb(t: asyncio.Task):
                try:
                    sent = t.result()
                    if not sent:
                        logger.warning("Admin invitation email was not sent for %s (check SMTP settings)", user.email)
                except Exception as exc:
                    logger.error("Failed sending admin invitation email for %s: %s", user.email, exc)

            invite_task.add_done_callback(_admin_added_cb)
        except Exception as mail_err:
            logger.warning("Failed preparing admin invitation token for %s: %s", user.email, mail_err)

        await db.auditlog.create(
            data={
                "eventType": "ADD_TENANT_ADMIN",
                "severity": "INFO",
                "actor": actor,
                "target": user.id,
                "tenantId": tenant_id,
                "description": f"Added administrator {email} ({role}) to tenant {t.name} and dispatched invitation email",
            }
        )

        return {"id": user.id, "email": user.email, "role": user.role}

    @staticmethod
    async def update_tenant(tenant_id: str, data: TenantUpdateRequest) -> TenantDetailResponse:
        t = await db.tenant.find_unique(where={"id": tenant_id})
        if not t:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        # Validate license count is not below current usage
        if data.license_count is not None:
            current_usage = await db.user.count(where={"tenantId": tenant_id, "role": {"in": ["STUDENT", "TEACHER"]}})
            if data.license_count < current_usage:
                raise ValueError(
                    f"License count ({data.license_count}) cannot be less than current usage ({current_usage} students + teachers)."
                )

        if data.slug and data.slug != t.slug:
            existing_slug = await db.tenant.find_unique(where={"slug": data.slug})
            if existing_slug:
                raise ValueError(f"Tenant slug '{data.slug}' is already in use by another institution.")

        if data.domain and data.domain != t.domain:
            existing_domain = await db.tenant.find_unique(where={"domain": data.domain})
            if existing_domain:
                raise ValueError(f"Domain '{data.domain}' is already mapped to another institution.")

        update_data: dict = {}
        if data.name:
            update_data["name"] = data.name
        if data.slug:
            update_data["slug"] = data.slug
        if data.type:
            update_data["type"] = data.type
        if data.status:
            update_data["status"] = data.status
        if data.domain is not None:
            update_data["domain"] = data.domain if data.domain else None
        if data.license_count is not None:
            update_data["licenseCount"] = data.license_count
        if data.config is not None:
            update_data["config"] = Json(data.config)

        updated = await db.tenant.update(where={"id": tenant_id}, data=update_data)
        try:
            from app.db.redis import get_redis

            r = get_redis()
            if t.slug != updated.slug:
                await r.delete(f"tenant:resolved:{t.slug}")
            if data.status == "SUSPENDED":
                await r.delete(f"tenant:resolved:{updated.id}")
                await r.delete(f"tenant:resolved:{updated.slug}")
                if t.domain:
                    await r.delete(f"tenant:resolved:{t.domain.lower()}")
                await r.setex(f"tenant:resolved:{updated.id}", 3600, f"SUSPENDED:{updated.id}")
                await r.setex(f"tenant:resolved:{updated.slug}", 3600, f"SUSPENDED:{updated.id}")
                domain_key = (updated.domain or t.domain or "").lower()
                if domain_key:
                    await r.setex(f"tenant:resolved:{domain_key}", 3600, f"SUSPENDED:{updated.id}")
            elif data.status == "ACTIVE":
                await r.setex(f"tenant:resolved:{updated.id}", 3600, f"ACTIVE:{updated.id}")
                await r.setex(f"tenant:resolved:{updated.slug}", 3600, f"ACTIVE:{updated.id}")
                if updated.domain:
                    await r.setex(f"tenant:resolved:{updated.domain.lower()}", 3600, f"ACTIVE:{updated.id}")
                elif t.domain:
                    await r.setex(f"tenant:resolved:{t.domain.lower()}", 3600, f"ACTIVE:{updated.id}")
            else:
                await r.delete(f"tenant:resolved:{updated.id}")
                await r.delete(f"tenant:resolved:{updated.slug}")
                if t.domain:
                    await r.delete(f"tenant:resolved:{t.domain.lower()}")
                if updated.domain:
                    await r.setex(f"tenant:resolved:{updated.domain.lower()}", 3600, f"ACTIVE:{updated.id}")
        except Exception as cache_err:
            logger.warning("Failed updating tenant Redis resolution keys for %s: %s", tenant_id, cache_err)
        if data.status == "SUSPENDED":
            from app.api.ws import manager as ws_manager

            await ws_manager.force_close_tenant(
                tenant_id, f"Institution '{updated.name}' has been suspended. Please contact your administrator."
            )
            if updated.slug:
                await ws_manager.force_close_tenant(
                    updated.slug, f"Institution '{updated.name}' has been suspended. Please contact your administrator."
                )
        return await SuperAdminService.get_tenant_by_id(tenant_id)

    @staticmethod
    async def delete_tenant(tenant_id: str, actor: str = "super_admin") -> Dict[str, Any]:
        t = await db.tenant.find_unique(where={"id": tenant_id})
        if not t:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        # Disconnect connected websocket users for this tenant
        try:
            from app.api.ws import manager as ws_manager

            await ws_manager.force_close_tenant(
                tenant_id, f"Institution '{t.name}' has been deleted by platform super admin."
            )
            if t.slug:
                await ws_manager.force_close_tenant(
                    t.slug, f"Institution '{t.name}' has been deleted by platform super admin."
                )
        except Exception as ws_err:
            logger.warning("Failed force closing websockets for deleted tenant %s: %s", tenant_id, ws_err)

        # Clear Redis keys
        try:
            from app.db.redis import get_redis

            r = get_redis()
            await r.delete(f"tenant:resolved:{t.id}")
            await r.delete(f"tenant:resolved:{t.slug}")
            if t.domain:
                await r.delete(f"tenant:resolved:{t.domain.lower()}")
        except Exception as cache_err:
            logger.warning("Failed deleting Redis keys for tenant %s: %s", tenant_id, cache_err)

        # Delete dependent license requests if any
        await db.licenserequest.delete_many(where={"tenantId": tenant_id})

        # Delete dependent data using database cascade transaction or explicit cleanup
        deleted = await db.tenant.delete(where={"id": tenant_id})

        await db.auditlog.create(
            data={
                "eventType": "DELETE_TENANT",
                "severity": "WARNING",
                "actor": actor,
                "target": tenant_id,
                "description": f"Super admin '{actor}' permanently deleted tenant '{deleted.name}' ({deleted.slug}).",
            }
        )

        return {"id": tenant_id, "slug": deleted.slug, "name": deleted.name, "status": "DELETED"}

    @staticmethod
    async def get_platform_stats() -> SuperAdminStatsResponse:
        total_tenants = await db.tenant.count()
        active_tenants = await db.tenant.count(where={"status": "ACTIVE"})
        total_students = await db.student.count()
        total_teachers = await db.teacher.count()
        active_sessions = await db.session.count(where={"isActive": True})
        total_attendance = await db.attendance.count()
        return SuperAdminStatsResponse(
            total_tenants=total_tenants,
            active_tenants=active_tenants,
            total_students=total_students,
            total_teachers=total_teachers,
            active_sessions=active_sessions,
            total_attendance=total_attendance,
        )

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

    @staticmethod
    async def get_global_audit_logs(
        page: int = 1,
        page_size: int = 25,
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
        tenant_id: Optional[str] = None,
        actor: Optional[str] = None,
    ) -> Dict[str, Any]:
        where: dict = {}
        if severity and severity != "ALL":
            where["severity"] = severity
        if event_type and event_type != "ALL":
            where["eventType"] = event_type
        if tenant_id and tenant_id != "ALL":
            where["tenantId"] = tenant_id
        if actor and actor.strip():
            where["actor"] = {"contains": actor.strip(), "mode": "insensitive"}

        total_items = await db.auditlog.count(where=where)
        skip = (page - 1) * page_size
        logs = await db.auditlog.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order={"timestamp": "desc"},
            include={"tenant": True},
        )

        items = [
            {
                "id": entry.id,
                "timestamp": entry.timestamp,
                "event_type": entry.eventType,
                "severity": entry.severity,
                "actor": entry.actor,
                "target": entry.target,
                "description": entry.description,
                "ip_address": entry.ipAddress,
                "tenant_id": entry.tenantId,
                "tenant_name": entry.tenant.name if entry.tenant else "Platform Global",
                "metadata": entry.metadata if isinstance(entry.metadata, dict) else {},
            }
            for entry in logs
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
    async def get_distinct_event_types() -> list[str]:
        rows = await db.query_raw(
            """
            SELECT DISTINCT event_type as val
            FROM audit_logs
            WHERE event_type IS NOT NULL AND TRIM(event_type) != ''
            ORDER BY val ASC
            """
        )
        return [str(r["val"]).strip() for r in rows if r.get("val")]

    @staticmethod
    async def get_system_health() -> Dict[str, Any]:
        import time
        from datetime import datetime, timezone

        # 1. Database check & pool stats
        db_start = time.perf_counter()
        db_ok = False
        active_queries = 0
        max_connections = 20
        try:
            await db.execute_raw("SELECT 1")
            db_ok = True
            try:
                stat_res = await db.query_raw(
                    "SELECT count(*)::int as count FROM pg_stat_activity WHERE state = 'active'"
                )
                if stat_res and len(stat_res) > 0 and "count" in stat_res[0]:
                    active_queries = int(stat_res[0]["count"])
                max_res = await db.query_raw("SHOW max_connections")
                if max_res and len(max_res) > 0 and "max_connections" in max_res[0]:
                    max_connections = int(max_res[0]["max_connections"])
            except Exception as pool_err:
                logger.debug("Could not query pg_stat_activity: %s", pool_err)
                active_queries = 1
        except Exception as db_err:
            logger.warning("Database health check ping failed: %s", db_err)
        db_latency = round((time.perf_counter() - db_start) * 1000, 2)

        # 2. Redis check
        redis_start = time.perf_counter()
        redis_ok = False
        redis_info = {}
        try:
            from app.db.redis import get_redis

            r = get_redis()
            pong = await r.ping()
            redis_ok = bool(pong)
            redis_info = {"connected": True}
        except Exception as e:
            redis_info = {"error": str(e)}
        redis_latency = round((time.perf_counter() - redis_start) * 1000, 2)

        # 3. Object / Media Storage check
        storage_start = time.perf_counter()
        storage_ok = True
        storage_details: Dict[str, Any] = {}
        try:
            from app.services.s3_service import s3_service

            bucket = s3_service.bucket_name
            if bucket:
                storage_details = {
                    "provider": "S3 Object Storage",
                    "bucket": bucket,
                    "status": "ready",
                }
            else:
                storage_details = {
                    "provider": "Local Media Storage",
                    "status": "ready",
                }
        except Exception as st_err:
            storage_ok = False
            storage_details = {"error": str(st_err), "status": "degraded"}
        storage_latency = round((time.perf_counter() - storage_start) * 1000, 2)

        # 4. Biometric Runtime & Hardware compute check
        hw_start = time.perf_counter()
        hw_status: Dict[str, Any] = {}
        try:
            from app.core.hardware import hardware_manager

            hw_status = hardware_manager.get_status()
        except Exception as hw_err:
            hw_status = {"active_device": "CPU", "target_device": "auto", "error": str(hw_err)}
        hw_latency = round((time.perf_counter() - hw_start) * 1000, 2)
        hw_healthy = not (hw_status.get("fallback_occurred") and hw_status.get("target_device") == "cuda")

        overall_status = "healthy"
        if not db_ok or not redis_ok:
            overall_status = "degraded"

        return {
            "status": overall_status,
            "timestamp": datetime.now(timezone.utc),
            "services": {
                "postgresql": {
                    "status": "healthy" if db_ok else "down",
                    "latency_ms": db_latency,
                    "details": {
                        "engine": "PostgreSQL 15+",
                        "status": "connected" if db_ok else "disconnected",
                        "active_queries": active_queries,
                        "max_connections": max_connections,
                    },
                },
                "redis_cache": {
                    "status": "healthy" if redis_ok else "down",
                    "latency_ms": redis_latency,
                    "details": {
                        "mode": "In-Memory Cache & Session Store",
                        "status": "connected" if redis_ok else "unreachable",
                        **redis_info,
                    },
                },
                "object_storage": {
                    "status": "healthy" if storage_ok else "degraded",
                    "latency_ms": storage_latency,
                    "details": storage_details,
                },
                "biometric_runtime": {
                    "status": "healthy" if hw_healthy else "degraded",
                    "latency_ms": hw_latency,
                    "details": {
                        "device": hw_status.get("active_device", "CPU"),
                        "target": hw_status.get("target_device", "auto"),
                        "dynamic_memory": hw_status.get("memory_growth_enabled", True),
                    },
                },
            },
            "server_uptime_seconds": round(time.monotonic(), 1),
            "database_pool": {"max_connections": max_connections, "active_queries": active_queries},
            "redis_status": {"ping_success": redis_ok},
            "hardware_status": hw_status,
            "storage_status": storage_details,
        }

    @staticmethod
    async def create_global_broadcast(data: Dict[str, Any], actor: str = "super_admin") -> Dict[str, Any]:
        title = data["title"].strip()
        message = data["message"].strip()
        target_role = data.get("target_role")
        target_tenant_id = data.get("target_tenant_id")
        msg_type = data.get("type", "info")
        category = data.get("category", "system")

        # Find target users
        where: dict = {}
        if target_role and target_role != "ALL":
            where["role"] = target_role
        if target_tenant_id:
            where["tenantId"] = target_tenant_id

        users = await db.user.find_many(where=where, take=5000)

        # Batch insert notifications
        created_count = 0
        for u in users:
            await db.notification.create(
                data={
                    "userId": u.id,
                    "role": u.role,
                    "title": title,
                    "message": message,
                    "type": msg_type,
                    "category": category,
                }
            )
            created_count += 1

        await db.auditlog.create(
            data={
                "eventType": "GLOBAL_BROADCAST",
                "severity": "WARNING" if msg_type in ["warning", "critical"] else "INFO",
                "actor": actor,
                "target": f"Role:{target_role or 'ALL'}, Tenant:{target_tenant_id or 'ALL'}",
                "description": f"Broadcasted '{title}': {message[:80]} ({created_count} recipients)",
                "metadata": Json(
                    {
                        "title": title,
                        "delivered_count": created_count,
                        "type": msg_type,
                        "category": category,
                        "target_role": target_role or "ALL",
                    }
                ),
            }
        )

        # Deliver in real-time over platform WebSocket
        try:
            from app.api.ws import manager as ws_manager

            payload = {
                "type": "notification",
                "event": "NOTIFICATION_RECEIVED",
                "data": {
                    "title": title,
                    "message": message,
                    "type": msg_type,
                    "category": category,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
                "title": title,
                "message": message,
                "category": category,
                "severity": msg_type,
            }
            await ws_manager.broadcast(
                message=payload,
                target_role=target_role if target_role != "ALL" else None,
                tenant_id=target_tenant_id,
            )
        except Exception as ws_err:
            logger.warning("WebSocket real-time broadcast skipped: %s", ws_err)

        return {
            "status": "success",
            "delivered_count": created_count,
            "title": title,
            "target_role": target_role or "ALL",
        }

    @staticmethod
    async def get_broadcast_history(
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        where: Dict[str, Any] = {"eventType": "GLOBAL_BROADCAST"}
        total = await db.auditlog.count(where=where)
        skip = (max(1, page) - 1) * page_size
        logs = await db.auditlog.find_many(
            where=where,
            order={"timestamp": "desc"},
            skip=skip,
            take=page_size,
        )

        items = []
        for log in logs:
            meta = log.metadata if isinstance(log.metadata, dict) else {}
            title = meta.get("title")
            delivered_count = meta.get("delivered_count", 0)
            if not title and "Broadcasted '" in log.description:
                try:
                    title = log.description.split("Broadcasted '")[1].split("'")[0]
                except Exception:
                    title = log.description

            items.append(
                {
                    "id": log.id,
                    "timestamp": log.timestamp,
                    "title": title or log.description,
                    "description": log.description,
                    "severity": log.severity,
                    "actor": log.actor,
                    "target": log.target,
                    "delivered_count": delivered_count,
                }
            )

        return {
            "items": items,
            "total_items": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if page_size > 0 and total > 0 else 1,
        }

    # License Request methods
    @staticmethod
    async def get_tenant_license_usage(tenant_id: str) -> Dict[str, Any]:
        tenant = await db.tenant.find_unique(where={"id": tenant_id})
        if not tenant:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        student_count = await db.user.count(where={"tenantId": tenant_id, "role": "STUDENT"})
        teacher_count = await db.user.count(where={"tenantId": tenant_id, "role": "TEACHER"})
        total_used = student_count + teacher_count
        license_count = tenant.licenseCount
        remaining = max(0, license_count - total_used)

        return {
            "tenant_id": tenant_id,
            "tenant_name": tenant.name,
            "license_count": license_count,
            "student_count": student_count,
            "teacher_count": teacher_count,
            "total_used": total_used,
            "remaining": remaining,
        }

    @staticmethod
    async def create_license_request(tenant_id: str, requested_by_user_id: str, requested_count: int) -> Dict[str, Any]:
        if requested_count <= 0:
            raise ValueError("Requested count must be positive.")

        tenant = await db.tenant.find_unique(where={"id": tenant_id})
        if not tenant:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        requester = await db.user.find_unique(where={"id": requested_by_user_id})
        if not requester:
            raise ValueError(f"User with id '{requested_by_user_id}' not found.")

        # Verify requester belongs to the tenant and has appropriate role
        if requester.tenantId != tenant_id:
            raise ValueError("Requester does not belong to this tenant.")

        if requester.role not in ["TENANT_ADMIN", "ADMIN"]:
            raise ValueError("Only tenant administrators can request licenses.")

        license_request = await db.licenserequest.create(
            data={
                "tenantId": tenant_id,
                "requestedById": requested_by_user_id,
                "requestedCount": requested_count,
                "status": "PENDING",
            }
        )

        await db.auditlog.create(
            data={
                "eventType": "LICENSE_REQUEST_CREATED",
                "severity": "INFO",
                "actor": requested_by_user_id,
                "target": license_request.id,
                "tenantId": tenant_id,
                "description": f"License request for {requested_count} additional licenses created by {requester.email}",
            }
        )

        return {
            "id": license_request.id,
            "tenant_id": license_request.tenantId,
            "requested_by_id": license_request.requestedById,
            "requested_count": license_request.requestedCount,
            "status": license_request.status,
            "created_at": license_request.createdAt,
        }

    @staticmethod
    async def get_license_requests(
        status: Optional[str] = None,
        tenant_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        where: dict = {}
        if status:
            where["status"] = status
        if tenant_id:
            where["tenantId"] = tenant_id

        total_items = await db.licenserequest.count(where=where)
        skip = (page - 1) * page_size
        requests = await db.licenserequest.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order={"createdAt": "desc"},
            include={"tenant": True, "requestedBy": True, "processedBy": True},
        )

        items = []
        for r in requests:
            items.append(
                {
                    "id": r.id,
                    "tenant_id": r.tenantId,
                    "tenant_name": r.tenant.name if r.tenant else None,
                    "tenant_slug": r.tenant.slug if r.tenant else None,
                    "requested_by_id": r.requestedById,
                    "requested_by_email": r.requestedBy.email if r.requestedBy else None,
                    "requested_by_name": r.requestedBy.email if r.requestedBy else None,
                    "requested_count": r.requestedCount,
                    "status": r.status,
                    "processed_by_id": r.processedById,
                    "processed_by_email": r.processedBy.email if r.processedBy else None,
                    "processed_at": r.processedAt,
                    "created_at": r.createdAt,
                    "updated_at": r.updatedAt,
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
    async def process_license_request(request_id: str, super_admin_user_id: str, approve: bool) -> Dict[str, Any]:
        license_request = await db.licenserequest.find_unique(where={"id": request_id}, include={"tenant": True})
        if not license_request:
            raise ValueError(f"License request with id '{request_id}' not found.")

        if license_request.status != "PENDING":
            raise ValueError(f"License request is already {license_request.status.lower()}.")

        processor = await db.user.find_unique(where={"id": super_admin_user_id})
        if not processor:
            raise ValueError(f"Processor user with id '{super_admin_user_id}' not found.")

        if processor.role != "SUPER_ADMIN":
            raise ValueError("Only super admins can process license requests.")

        if approve:
            # Increase tenant's license count
            new_license_count = license_request.tenant.licenseCount + license_request.requestedCount
            await db.tenant.update(where={"id": license_request.tenantId}, data={"licenseCount": new_license_count})
            new_status = "APPROVED"
            description = f"License request for {license_request.requestedCount} licenses approved. Tenant license count increased to {new_license_count}."
        else:
            new_status = "REJECTED"
            description = f"License request for {license_request.requestedCount} licenses rejected."

        updated_request = await db.licenserequest.update(
            where={"id": request_id},
            data={
                "status": new_status,
                "processedById": super_admin_user_id,
                "processedAt": datetime.now(timezone.utc),
            },
        )

        await db.auditlog.create(
            data={
                "eventType": f"LICENSE_REQUEST_{new_status}",
                "severity": "INFO",
                "actor": super_admin_user_id,
                "target": request_id,
                "tenantId": license_request.tenantId,
                "description": description,
            }
        )

        return {
            "id": updated_request.id,
            "tenant_id": updated_request.tenantId,
            "requested_by_id": updated_request.requestedById,
            "requested_count": updated_request.requestedCount,
            "status": updated_request.status,
            "processed_by_id": updated_request.processedById,
            "processed_at": updated_request.processedAt,
            "created_at": updated_request.createdAt,
            "updated_at": updated_request.updatedAt,
        }
