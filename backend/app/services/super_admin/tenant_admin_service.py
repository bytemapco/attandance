import asyncio
from typing import Any, Dict
from app.core.logging_config import get_logger
from app.db.client import db
from app.core.security import hash_password, generate_temporary_password

logger = get_logger("app.super_admin.admin_mgmt")


class TenantAdminService:
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
    async def update_tenant_admin_email(
        tenant_id: str, admin_id: str, new_email: str, actor: str = "super_admin"
    ) -> Dict[str, Any]:
        t = await db.tenant.find_unique(where={"id": tenant_id})
        if not t:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        user = await db.user.find_unique(where={"id": admin_id})
        if not user or user.tenantId != tenant_id:
            raise ValueError("Administrator not found for this institution.")

        normalized_email = new_email.strip().lower()
        if normalized_email == user.email.lower():
            return {"id": user.id, "email": user.email, "role": user.role}

        existing_user = await db.user.find_unique(where={"email": normalized_email})
        if existing_user and existing_user.id != admin_id:
            raise ValueError(f"User with email '{normalized_email}' is already registered.")

        old_email = user.email
        updated_user = await db.user.update(
            where={"id": admin_id},
            data={"email": normalized_email},
        )

        await db.auditlog.create(
            data={
                "eventType": "UPDATE_TENANT_ADMIN_EMAIL",
                "severity": "INFO",
                "actor": actor,
                "target": admin_id,
                "tenantId": tenant_id,
                "description": f"Updated administrator email from '{old_email}' to '{normalized_email}' in tenant {t.name}",
            }
        )
        return {"id": updated_user.id, "email": updated_user.email, "role": updated_user.role}

    @staticmethod
    async def delete_tenant_admin(
        tenant_id: str, admin_id: str, actor: str = "super_admin"
    ) -> Dict[str, Any]:
        t = await db.tenant.find_unique(where={"id": tenant_id})
        if not t:
            raise ValueError(f"Tenant with id '{tenant_id}' not found.")

        user = await db.user.find_unique(where={"id": admin_id})
        if not user or user.tenantId != tenant_id:
            raise ValueError("Administrator not found for this institution.")

        deleted = await db.user.delete(where={"id": admin_id})

        await db.auditlog.create(
            data={
                "eventType": "DELETE_TENANT_ADMIN",
                "severity": "WARNING",
                "actor": actor,
                "target": admin_id,
                "tenantId": tenant_id,
                "description": f"Super admin '{actor}' permanently removed administrator '{deleted.email}' from tenant '{t.name}'",
            }
        )
        return {"id": admin_id, "email": deleted.email, "status": "DELETED"}
