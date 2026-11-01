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
        campus_latitude: float | None = None,
        campus_longitude: float | None = None,
        geofence_radius_meters: int | None = None,
        min_attendance_pct: float | None = None,
        verification_window_min: int | None = None,
        saturday_enabled: bool | None = None,
    ) -> SystemConfiguration:
        config = await self.get_config(tenant_id=tenant_id)

        values = {
            "isFaceRecognitionEnabled": is_face_recognition_enabled,
            "isGpsVerificationEnabled": is_gps_verification_enabled,
            "isAiBackgroundValidationEnabled": is_ai_background_validation_enabled,
            "campusLatitude": campus_latitude,
            "campusLongitude": campus_longitude,
            "geofenceRadiusMeters": geofence_radius_meters,
            "minAttendancePct": min_attendance_pct,
            "verificationWindowMin": verification_window_min,
            "saturdayEnabled": saturday_enabled,
        }
        update_data = {key: value for key, value in values.items() if value is not None}

        return await db.systemconfiguration.update(
            where={"id": config.id},
            data=update_data,
        )
