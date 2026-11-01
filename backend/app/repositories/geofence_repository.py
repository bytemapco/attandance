from prisma.models import Geofence
from app.db.client import db


class GeofenceRepository:
    async def get_by_class_id(self, class_id: str) -> Geofence | None:
        """Legacy AcademicClass fence, used by the old session flow."""
        return await db.geofence.find_unique(where={"academicClassId": class_id})
