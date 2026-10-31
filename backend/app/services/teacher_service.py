from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status

from app.repositories.teacher_repository import TeacherRepository
from app.repositories.class_repository import ClassRepository
from app.repositories.geofence_repository import GeofenceRepository
from app.schemas.teacher import (
    AbsentStudentItem,
    AcademicClassWithGeofenceResponse,
    AttendanceMatrixResponse,
    BulkMarkRequest,
    ClassStatsResponse,
    GeofenceResponse,
    GeofenceUpsert,
    SessionAttendanceResponse,
    SessionWithClassResponse,
    SmartPassVerifyResponse,
    StudentClassHistoryResponse,
    TeacherSmartPassResponse,
)
from app.services.teacher.teacher_export_service import TeacherExportService
from app.services.teacher.teacher_geofence_service import TeacherGeofenceService
from app.services.teacher.teacher_history_service import TeacherHistoryService
from app.services.teacher.teacher_matrix_service import TeacherMatrixService
from app.services.teacher.teacher_attendance_roll_service import TeacherAttendanceRollService
from app.services.teacher.teacher_session_service import TeacherSessionService


class TeacherService:
    def __init__(self) -> None:
        self.teacher_repo = TeacherRepository()
        self.class_repo = ClassRepository()
        self.geofence_repo = GeofenceRepository()

    async def get_teacher_by_user_id(self, user_id: str):
        teacher = await self.teacher_repo.get_by_user_id(user_id)
        if not teacher:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher profile not found.")
        return teacher

    async def get_classes_by_teacher_user_id(
        self, user_id: str, include_archived: bool = False
    ) -> List[AcademicClassWithGeofenceResponse]:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherGeofenceService.get_classes_by_teacher_id(teacher.id, include_archived=include_archived)

    async def upsert_geofence(self, user_id: str, class_id: str, data: GeofenceUpsert) -> GeofenceResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherGeofenceService.upsert_geofence(teacher.id, class_id, data)

    async def get_session_attendance_roll(self, user_id: str, session_id: str) -> SessionAttendanceResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherAttendanceRollService.get_session_attendance_roll(teacher.id, session_id)

    # Alias for backward compatibility
    get_session_attendance_roster = get_session_attendance_roll

    async def get_absent_students(self, session_id: str, user_id: str) -> List[AbsentStudentItem]:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherAttendanceRollService.get_absent_students(teacher.id, session_id)

    async def bulk_mark_attendance(self, session_id: str, user_id: str, request: BulkMarkRequest) -> int:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherAttendanceRollService.bulk_mark_attendance(teacher.id, session_id, request)

    async def bulk_mark_absent(self, user_id: str, session_id: str, data: BulkMarkRequest) -> int:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherAttendanceRollService.bulk_mark_attendance(teacher.id, session_id, data)

    async def manual_override_attendance(
        self, user_id: str, session_id: str, student_id: str, status_val: str
    ) -> bool:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherAttendanceRollService.manual_override_attendance(teacher.id, session_id, student_id, status_val)

    async def get_teacher_sessions(self, user_id: str) -> List[SessionWithClassResponse]:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherSessionService.get_teacher_sessions(teacher.id)

    async def verify_smart_pass(self, user_id: str, session_id: str, qr_token: str) -> SmartPassVerifyResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        actor_email = teacher.user.email if teacher.user and teacher.user.email else user_id
        return await TeacherSessionService.verify_smart_pass(teacher.id, actor_email, session_id, qr_token)

    async def generate_session_smart_pass(self, user_id: str, session_id: str) -> TeacherSmartPassResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherSessionService.generate_session_smart_pass(teacher.id, teacher.userId, session_id)

    async def export_class_attendance(
        self, class_id: str, user_id: str, from_date: Optional[datetime], to_date: Optional[datetime]
    ) -> List[dict]:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherExportService.export_class_attendance(class_id, teacher.id, from_date, to_date)

    async def get_class_stats(self, user_id: str, class_id: str) -> ClassStatsResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherMatrixService.get_class_stats(teacher.id, class_id)

    async def get_student_class_attendance_history(
        self, user_id: str, class_id: str, student_id: str
    ) -> StudentClassHistoryResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherHistoryService.get_student_class_attendance_history(teacher.id, class_id, student_id)

    async def get_class_attendance_matrix(self, user_id: str, class_id: str) -> AttendanceMatrixResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        return await TeacherMatrixService.get_class_attendance_matrix(teacher.id, class_id)
