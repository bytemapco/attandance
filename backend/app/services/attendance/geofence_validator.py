from typing import Optional, Tuple
from app.core.logging_config import get_logger
from app.repositories.geofence_repo import GeofenceRepository
from app.utils.geofencing import GPSCoordinate, calculate_haversine_distance, is_within_geofence

logger = get_logger("app.attendance.geofence")


class GeofenceValidator:
    def __init__(self) -> None:
        self.geofence_repo = GeofenceRepository()

    async def validate_student_location(
        self, class_id: str, student_id: str, latitude: float, longitude: float, accuracy: float
    ) -> Tuple[bool, Optional[str]]:
        geofence = await self.geofence_repo.get_by_class_id(class_id)
        if not geofence:
            logger.warning("Missing geofence for class %s (student %s)", class_id, student_id)
            return True, "Missing Geofence Data"

        student_coord = GPSCoordinate(latitude, longitude)
        classroom_coord = GPSCoordinate(geofence.latitude, geofence.longitude)
        is_inside = is_within_geofence(
            student_coord=student_coord,
            classroom_coord=classroom_coord,
            base_radius=geofence.radiusMeters,
            student_accuracy=accuracy,
        )
        if not is_inside:
            distance = calculate_haversine_distance(student_coord, classroom_coord)
            effective_radius = geofence.radiusMeters + accuracy
            raise ValueError(
                f"Student is outside geofence boundary by {distance - effective_radius:.1f}m. "
                f"(Distance: {distance:.1f}m, Effective Allowed Radius: {effective_radius:.1f}m)"
            )
        return False, None
