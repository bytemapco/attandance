from typing import List
from fastapi import HTTPException, status
from app.db.client import db
from app.repositories.class_repository import ClassRepository
from app.repositories.geofence_repository import GeofenceRepository
from app.schemas.teacher import (
    AcademicClassWithGeofenceResponse,
    GeofenceResponse,
    GeofenceUpsert,
)


class TeacherGeofenceService:
    def __init__(self) -> None:
        self.class_repo = ClassRepository()
        self.geofence_repo = GeofenceRepository()

    @classmethod
    async def get_classes_by_teacher_id(
        cls, teacher_id: str, include_archived: bool = False
    ) -> List[AcademicClassWithGeofenceResponse]:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        where: dict = {"teacherId": teacher_id}
        if not include_archived:
            where["OR"] = [
                {"academicYearId": None},
                {"academicYear": {"is": {"endDate": {"gte": now}}}},
            ]
        classes = await db.academicclass.find_many(
            where=where, include={"geofence": True, "subject": True, "academicYear": True}
        )
        return [
            AcademicClassWithGeofenceResponse(
                id=c.id,
                name=c.name,
                subject=c.subject.name if c.subject else "—",
                teacherId=c.teacherId,
                geofence=GeofenceResponse.model_validate(c.geofence) if c.geofence else None,
            )
            for c in classes
        ]

    @classmethod
    async def upsert_geofence(cls, teacher_id: str, class_id: str, data: GeofenceUpsert) -> GeofenceResponse:
        academic_class = await ClassRepository().get_by_id(class_id)
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You do not teach this academic class."
            )
        geofence = await GeofenceRepository().upsert_geofence(
            class_id=class_id, latitude=data.latitude, longitude=data.longitude, radius=data.radius_meters
        )
        return GeofenceResponse.model_validate(geofence)
