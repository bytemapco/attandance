import base64
import json
import xml.etree.ElementTree as ET
from typing import Optional, Dict, Any

from app.core.logging_config import get_logger
from app.core.security import create_access_token
from app.db.client import db

logger = get_logger("app.sso")


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

    @staticmethod
    async def process_saml_assertion(
        saml_response_b64: str,
        tenant_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        try:
            xml_bytes = base64.b64decode(saml_response_b64)
            xml_str = xml_bytes.decode("utf-8", errors="ignore")
        except Exception as exc:
            raise ValueError(f"Invalid Base64-encoded SAML response: {exc}")

        # Secure XML inspection against entity expansion and XXE
        if "<!DOCTYPE" in xml_str.upper() or "<!ENTITY" in xml_str.upper():
            logger.warning("Security alert: Blocked SAML payload containing DOCTYPE or ENTITY declaration.")
            raise ValueError("Security violation: DOCTYPE and external entity declarations are prohibited.")

        # Parse XML assertion for NameID / Email
        email = None
        role = "STUDENT"

        try:
            root = ET.fromstring(xml_str)
            for elem in root.iter():
                tag = elem.tag.lower()
                if "nameid" in tag and elem.text and "@" in elem.text:
                    email = elem.text.strip().lower()
                elif "attribute" in tag:
                    attr_name = elem.attrib.get("Name", "").lower()
                    val = "".join(elem.itertext()).strip()
                    if "email" in attr_name and "@" in val:
                        email = val.lower()
                    elif "role" in attr_name:
                        role_str = val.upper()
                        if "TEACH" in role_str or "FACULTY" in role_str:
                            role = "TEACHER"
                        elif "ADMIN" in role_str:
                            role = "ADMIN"
        except Exception as parse_err:
            logger.warning("Could not parse standard XML tags from SAML payload: %s", parse_err)

        if not email:
            raise ValueError("No valid NameID or email address found in SAML assertion.")

        # Find or link existing user
        user = await db.user.find_unique(where={"email": email})
        if not user:
            from app.core.security import hash_password, generate_temporary_password

            user_data = {
                "email": email,
                "hashedPassword": hash_password(generate_temporary_password()),
                "role": role,
                "isActive": True,
            }
            if tenant_id:
                user_data["tenantId"] = tenant_id

            user = await db.user.create(data=user_data)
            logger.info("Auto-provisioned SSO user %s (%s)", email, role)

        user_tenant_id = getattr(user, "tenantId", None)
        access_token = create_access_token(
            subject=user.id,
            role=user.role,
            extra_data={"email": user.email, "tid": user_tenant_id, "tenant_id": user_tenant_id},
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "email": user.email,
            "role": user.role,
            "tenant_id": user_tenant_id,
        }
