from typing import Optional
from prisma.models import SystemConfiguration
from app.db.client import db


class SystemConfigRepository:
    async def get_config(self, tenant_id: Optional[str] = None) -> SystemConfiguration:
        """
        Gets the system configuration for the specified tenant.
        If it doesn't exist, creates a default one scoped to the tenant.
        """
        where = {"tenantId": tenant_id} if tenant_id else {}
        config = await db.systemconfiguration.find_first(where=where)
        if not config:
            create_data = {
                "isFaceRecognitionEnabled": True,
                "isGpsVerificationEnabled": True,
                "isAiBackgroundValidationEnabled": True,
            }
            if tenant_id:
                create_data["tenantId"] = tenant_id
            config = await db.systemconfiguration.create(data=create_data)
        return config

    async def update_config(
        self,
        tenant_id: Optional[str] = None,
        is_face_recognition_enabled: bool | None = None,
        is_gps_verification_enabled: bool | None = None,
        is_ai_background_validation_enabled: bool | None = None,
    ) -> SystemConfiguration:
        config = await self.get_config(tenant_id=tenant_id)

        update_data = {}
        if is_face_recognition_enabled is not None:
            update_data["isFaceRecognitionEnabled"] = is_face_recognition_enabled
        if is_gps_verification_enabled is not None:
            update_data["isGpsVerificationEnabled"] = is_gps_verification_enabled
        if is_ai_background_validation_enabled is not None:
            update_data["isAiBackgroundValidationEnabled"] = is_ai_background_validation_enabled

        return await db.systemconfiguration.update(
            where={"id": config.id},
            data=update_data,
        )
