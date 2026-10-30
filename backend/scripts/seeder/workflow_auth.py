from typing import Optional
from app.core.logging_config import get_logger
from .client import APIClient
from .config import SeederConfig

logger = get_logger("app.seeder.auth")


async def ensure_local_superadmin_if_needed(config: SeederConfig) -> None:
    """Ensure root Super Admin exists in local database prior to API login."""
    if config.is_prod:
        return

    from app.core.security import hash_password
    from app.db.client import connect_db, db, disconnect_db

    await connect_db()
    try:
        user = await db.user.find_unique(where={"email": config.superadmin_email})
        if not user:
            logger.info("Provisioning initial local Super Admin: %s", config.superadmin_email)
            await db.user.create(
                data={
                    "email": config.superadmin_email,
                    "hashedPassword": hash_password(config.superadmin_password),
                    "role": "SUPER_ADMIN",
                    "isActive": True,
                }
            )
            # Ensure base system configuration exists
            if not await db.systemconfiguration.find_first():
                await db.systemconfiguration.create(
                    data={
                        "isFaceRecognitionEnabled": True,
                        "isGpsVerificationEnabled": True,
                        "isAiBackgroundValidationEnabled": True,
                    }
                )
    finally:
        await disconnect_db()


async def login_user(
    client: APIClient,
    email: str,
    password: str,
    device_uuid: Optional[str] = None,
) -> str:
    """Authenticate any user via actual API and return JWT access token."""
    payload = {"email": email, "password": password}
    if device_uuid:
        payload["device_uuid"] = device_uuid
    result = await client.post("/auth/login", json_data=payload)
    token = result.get("access_token")
    if not token:
        raise RuntimeError(f"Login succeeded but no access_token in response: {result}")
    return token


async def login_superadmin(client: APIClient, config: SeederConfig) -> str:
    """Authenticate Super Admin via API."""
    token = await login_user(client, config.superadmin_email, config.superadmin_password)
    client.set_token(token)
    client.set_tenant_id(None)
    logger.info("Super Admin authenticated successfully: %s", config.superadmin_email)
    return token


async def login_tenant_admin(client: APIClient, email: str, password: str, tenant_id: str) -> str:
    """Authenticate Tenant Admin and bind tenant context."""
    token = await login_user(client, email, password)
    client.set_token(token)
    client.set_tenant_id(tenant_id)
    logger.info("Tenant Admin authenticated successfully: %s (Tenant: %s)", email, tenant_id)
    return token
