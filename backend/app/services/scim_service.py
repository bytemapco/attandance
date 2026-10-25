from typing import Optional, Dict, Any
from datetime import datetime, timezone

from app.core.logging_config import get_logger
from app.core.security import hash_password, generate_temporary_password
from app.db.client import db

logger = get_logger("app.scim")


class SCIMService:
    @staticmethod
    def get_service_provider_config() -> Dict[str, Any]:
        return {
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
            "documentationUri": "https://smartattendance.edu/docs/scim",
            "patch": {"supported": False},
            "bulk": {"supported": False, "maxOperations": 0, "maxPayloadSize": 0},
            "filter": {"supported": True, "maxResults": 100},
            "changePassword": {"supported": True},
            "sort": {"supported": True},
            "etag": {"supported": False},
            "authenticationSchemes": [
                {
                    "name": "OAuth Bearer Token",
                    "description": "Authentication using Bearer Tokens",
                    "specUri": "http://www.rfc-editor.org/info/rfc6750",
                    "type": "oauthbearertoken",
                    "primary": True,
                }
            ],
        }

    @staticmethod
    def format_scim_user(user: Any) -> Dict[str, Any]:
        email = getattr(user, "email", "")
        role = getattr(user, "role", "STUDENT")
        is_active = getattr(user, "isActive", True)
        user_id = getattr(user, "id", "")
        created_at = getattr(user, "createdAt", datetime.now(timezone.utc))

        return {
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:User"],
            "id": user_id,
            "userName": email,
            "name": {
                "formatted": email.split("@")[0],
                "familyName": "User",
                "givenName": email.split("@")[0],
            },
            "emails": [{"value": email, "type": "work", "primary": True}],
            "active": is_active,
            "roles": [{"value": role, "primary": True}],
            "meta": {
                "resourceType": "User",
                "created": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
                "location": f"/api/v1/scim/v2/Users/{user_id}",
            },
        }

    @staticmethod
    async def list_users(
        tenant_id: Optional[str] = None,
        start_index: int = 1,
        count: int = 20,
    ) -> Dict[str, Any]:
        where: Dict[str, Any] = {}
        if tenant_id and tenant_id != "default-institution":
            where["tenantId"] = tenant_id

        total_results = await db.user.count(where=where)
        skip = max(0, start_index - 1)
        users = await db.user.find_many(where=where, skip=skip, take=count)

        resources = [SCIMService.format_scim_user(u) for u in users]
        return {
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
            "totalResults": total_results,
            "startIndex": start_index,
            "itemsPerPage": len(resources),
            "Resources": resources,
        }

    @staticmethod
    async def get_user_by_id(user_id: str, tenant_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        user = await db.user.find_unique(where={"id": user_id})
        if not user:
            return None
        if tenant_id and tenant_id != "default-institution" and getattr(user, "tenantId", None) != tenant_id:
            return None
        return SCIMService.format_scim_user(user)

    @staticmethod
    async def create_user(
        scim_payload: Dict[str, Any],
        tenant_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        email = scim_payload.get("userName")
        if not email:
            emails = scim_payload.get("emails", [])
            if emails and isinstance(emails, list):
                email = emails[0].get("value")

        if not email:
            raise ValueError("SCIM payload must contain a valid 'userName' or primary email.")

        existing = await db.user.find_unique(where={"email": email.strip().lower()})
        if existing:
            raise ValueError(f"User with email '{email}' already exists.")

        roles = scim_payload.get("roles", [])
        role = "STUDENT"
        if roles and isinstance(roles, list):
            r_val = roles[0].get("value", "").upper()
            if "TEACH" in r_val or "FACULTY" in r_val:
                role = "TEACHER"
            elif "ADMIN" in r_val:
                role = "ADMIN"

        plain_pwd = generate_temporary_password()
        user_data = {
            "email": email.strip().lower(),
            "hashedPassword": hash_password(plain_pwd),
            "role": role,
            "isActive": scim_payload.get("active", True),
            "mustChangePassword": True,
        }
        if tenant_id and tenant_id != "default-institution":
            user_data["tenantId"] = tenant_id

        user = await db.user.create(data=user_data)
        logger.info("SCIM 2.0 provisioned user: %s (id: %s)", email, user.id)
        return SCIMService.format_scim_user(user)

    @staticmethod
    async def delete_user(user_id: str, tenant_id: Optional[str] = None) -> bool:
        user = await db.user.find_unique(where={"id": user_id})
        if not user:
            return False
        if tenant_id and tenant_id != "default-institution" and getattr(user, "tenantId", None) != tenant_id:
            return False
        await db.user.delete(where={"id": user_id})
        logger.info("SCIM 2.0 deprovisioned user: %s", user_id)
        return True
