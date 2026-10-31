from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from prisma.models import Teacher

from app.api.dependencies import get_current_teacher
from app.schemas.teacher import (
    AcademicClassWithGeofenceResponse,
    AttendanceMatrixResponse,
    ClassAttendanceExportItem,
    ClassStatsResponse,
    GeofenceResponse,
    GeofenceUpsert,
    StudentClassHistoryResponse,
)
from app.services.teacher_service import TeacherService

router = APIRouter()


@router.get("/my-classes", response_model=list[AcademicClassWithGeofenceResponse])
async def get_my_classes(
    include_archived: bool = False,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> list[AcademicClassWithGeofenceResponse]:
    return await teacher_service.get_classes_by_teacher_user_id(teacher.userId, include_archived=include_archived)


@router.post("/classes/{class_id}/geofence", response_model=GeofenceResponse)
async def upsert_geofence(
    class_id: str,
    data: GeofenceUpsert,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> GeofenceResponse:
    return await teacher_service.upsert_geofence(user_id=teacher.userId, class_id=class_id, data=data)


@router.get("/classes/{class_id}/stats", response_model=ClassStatsResponse)
async def get_class_stats(
    class_id: str,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> ClassStatsResponse:
    return await teacher_service.get_class_stats(user_id=teacher.userId, class_id=class_id)


@router.get("/classes/{class_id}/students/{student_id}/history", response_model=StudentClassHistoryResponse)
async def get_student_class_attendance_history(
    class_id: str,
    student_id: str,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> StudentClassHistoryResponse:
    return await teacher_service.get_student_class_attendance_history(
        user_id=teacher.userId, class_id=class_id, student_id=student_id
    )


@router.get("/classes/{class_id}/matrix", response_model=AttendanceMatrixResponse)
async def get_class_attendance_matrix(
    class_id: str,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> AttendanceMatrixResponse:
    return await teacher_service.get_class_attendance_matrix(user_id=teacher.userId, class_id=class_id)


@router.get("/classes/{class_id}/export-attendance", response_model=list[ClassAttendanceExportItem])
async def export_class_attendance(
    class_id: str,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    teacher: Teacher = Depends(get_current_teacher),
    teacher_service: TeacherService = Depends(),
) -> list[ClassAttendanceExportItem]:
    rows = await teacher_service.export_class_attendance(
        class_id=class_id, user_id=teacher.userId, from_date=from_date, to_date=to_date
    )
    return [ClassAttendanceExportItem.model_validate(r) for r in rows]
