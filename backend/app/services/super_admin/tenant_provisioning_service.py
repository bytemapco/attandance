import asyncio
from prisma import Json
from app.core.logging_config import get_logger
from app.db.client import db
from app.services.tenant_resolver import remember_tenant
from app.core.security import hash_password, generate_temporary_password
from app.schemas.super_admin import (
    TenantProvisionRequest,
    TenantDetailResponse,
)

logger = get_logger("app.super_admin.tenant")


class TenantProvisioningService:
    @staticmethod
    async def provision_tenant(data: TenantProvisionRequest, actor: str = "super_admin") -> TenantDetailResponse:
        existing = await db.tenant.find_unique(where={"slug": data.slug})
        if existing:
            raise ValueError(f"Tenant slug '{data.slug}' is already taken.")

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
                "type": "COLLEGE",
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
            await remember_tenant(tenant.id, (tenant.slug,))
        except Exception as cache_err:
            logger.warning("Failed to cache tenant resolution in Redis for %s: %s", tenant.slug, cache_err)

        async def send_admin_invitation(created_admin: dict, semaphore: asyncio.Semaphore) -> bool:
            async with semaphore:
                try:
                    from app.services.auth_service import AuthService
                    from app.services.email_service import email_service

                    token = await AuthService().create_invitation_token(
                        user_id=created_admin["id"],
                        email=created_admin["email"],
                        role=created_admin["role"],
                        name=created_admin["name"],
                    )
                    return await email_service.send_invitation_email(
                        to_email=created_admin["email"],
                        recipient_name=created_admin["name"],
                        role=created_admin["role"],
                        invite_token=token,
                        identifier_label="Institution ID",
                        identifier_value=tenant.slug,
                        temp_password=created_admin["plain_pwd"] if created_admin["must_change"] else None,
                    )
                except Exception:
                    logger.exception("Failed preparing or sending admin invitation for %s", created_admin["email"])
                    return False

        semaphore = asyncio.Semaphore(5)
        invitation_results = await asyncio.gather(
            *(send_admin_invitation(admin, semaphore) for admin in created_admin_users)
        )
        invitations_sent = sum(invitation_results)
        for created_admin, invitation_sent in zip(created_admin_users, invitation_results):
            created_admin["invitation_sent"] = invitation_sent

        await db.auditlog.create(
            data={
                "eventType": "PROVISION_TENANT",
                "severity": "INFO",
                "actor": actor,
                "target": tenant.id,
                "description": (
                    f"Provisioned tenant {tenant.name} ({tenant.slug}) with {len(created_admin_users)} admin(s); "
                    f"invitations_sent={invitations_sent}"
                ),
            }
        )

        return TenantDetailResponse(
            id=tenant.id,
            slug=tenant.slug,
            name=tenant.name,
            type=tenant.type,
            status=tenant.status,
            license_count=tenant.licenseCount,
            created_at=tenant.createdAt,
            config=default_config,
            admin_users=[
                {
                    "id": u["id"],
                    "email": u["email"],
                    "role": u["role"],
                    "invitation_sent": u["invitation_sent"],
                }
                for u in created_admin_users
            ],
        )

