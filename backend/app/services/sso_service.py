import json
from typing import Any, Dict

from app.db.client import db


class SSOService:
    @staticmethod
    async def get_tenant_sso_config(tenant_slug: str) -> Dict[str, Any]:
        tenant = await db.tenant.find_unique(where={"slug": tenant_slug})
        if not tenant:
            raise ValueError(f"Tenant '{tenant_slug}' not found.")

        config = tenant.config or {}
        if isinstance(config, str):
            try:
                config = json.loads(config)
            except Exception:
                config = {}

        return {
            "tenant_id": tenant.id,
            "tenant_slug": tenant.slug,
            "sso_enabled": bool(config.get("sso_enabled", True)),
            "idp_entity_id": config.get("idp_entity_id", f"https://idp.enterprise.com/{tenant.slug}"),
            "sp_entity_id": f"https://smartattendance.edu/sp/{tenant.slug}",
            "acs_url": "/api/v1/auth/sso/saml/acs",
            "oidc_issuer": config.get("oidc_issuer", f"https://login.microsoftonline.com/{tenant.slug}/v2.0"),
        }
