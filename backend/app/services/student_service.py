from fastapi import HTTPException, status

from app.core.logging_config import get_logger
from app.db.client import db
from app.repositories.student_repo import StudentRepository
from app.schemas.student import StudentAttendanceItem, StudentAttendanceHistoryResponse, StudentClassResponse

logger = get_logger("app.student.service")


class StudentService:
    def __init__(self) -> None:
        self.student_repo = StudentRepository()

    async def get_student_by_user_id(self, user_id: str):
        student = await self.student_repo.get_by_user_id(user_id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found.")
        return student

    async def get_student_classes(self, user_id: str) -> list[StudentClassResponse]:
        student = await self.get_student_by_user_id(user_id)
        enrollments = await db.enrollment.find_many(
            where={"studentId": student.id},
            include={
                "academicClass": {
                    "include": {
                        "subject": True,
                        "teacher": True,
                        "geofence": True,
                        "sessions": {"where": {"isActive": True}},
                    }
                }
            },
        )

        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)

        # Proactively deactivate expired sessions to sync database state
        expired_session_ids = []
        for e in enrollments:
            for s in e.academicClass.sessions:
                s_end = s.endTime.replace(tzinfo=timezone.utc) if s.endTime.tzinfo is None else s.endTime
                if s.isActive and s_end <= now:
                    expired_session_ids.append(s.id)

        if expired_session_ids:
            from app.services.session_service import SessionService

            sess_svc = SessionService()
            for s_id in expired_session_ids:
                try:
                    await sess_svc.close_session(s_id)
                except Exception as ex:
                    logger.warning("Could not cleanly close expired session %s: %s", s_id, ex)

        res = []
        for e in enrollments:
            valid_sessions = [s for s in e.academicClass.sessions if s.isActive and s.id not in expired_session_ids]
            active_s = valid_sessions[0] if valid_sessions else None

            res.append(
                StudentClassResponse(
                    class_id=e.academicClass.id,
                    class_name=e.academicClass.name,
                    subject=e.academicClass.subject.name if e.academicClass.subject else "—",
                    teacher_name=f"{e.academicClass.teacher.firstName} {e.academicClass.teacher.lastName}"
                    if e.academicClass.teacher
                    else "—",
                    active_session_id=active_s.id if active_s else None,
                    session_end_time=active_s.endTime if active_s else None,
                    latitude=e.academicClass.geofence.latitude if e.academicClass.geofence else None,
                    longitude=e.academicClass.geofence.longitude if e.academicClass.geofence else None,
                    radius_meters=e.academicClass.geofence.radiusMeters if e.academicClass.geofence else None,
                )
            )
        return res

    async def get_student_attendance_history(self, user_id: str) -> StudentAttendanceHistoryResponse:
        student = await self.get_student_by_user_id(user_id)
        enrollments = await db.enrollment.find_many(where={"studentId": student.id}, include={"academicClass": True})
        class_ids = [e.academicClassId for e in enrollments]

        overall_percentage = 0.0
        if class_ids:
            total_sessions = await db.session.count(where={"academicClassId": {"in": class_ids}})
            if total_sessions > 0:
                present_count = await db.attendance.count(
                    where={"studentId": student.id, "status": {"in": ["Present", "Approved"]}}
                )
                overall_percentage = round((present_count / total_sessions) * 100.0, 2)

        records = await db.attendance.find_many(
            where={"studentId": student.id},
            include={"session": {"include": {"academicClass": {"include": {"subject": True}}}}},
            order={"createdAt": "desc"},
        )

        return StudentAttendanceHistoryResponse(
            student_id=student.id,
            overall_attendance_percentage=overall_percentage,
            history=[
                StudentAttendanceItem(
                    attendance_id=r.id,
                    class_id=ac.id,
                    class_name=ac.name,
                    subject=ac.subject.name if ac.subject and hasattr(ac.subject, "name") else "—",
                    session_id=r.session.id,
                    status=r.status,
                    marked_at=r.createdAt,
                    face_score=r.faceScore,
                    liveness_score=r.livenessScore,
                    background_score=r.backgroundScore,
                    final_ai_score=r.finalAiScore,
                    teacher_note=r.remarks,
                )
                for r in records
                if (ac := r.session.academicClass)
            ],
        )

    async def verify_teacher_smart_pass_and_mark(
        self,
        student,
        qr_token: str,
        latitude: float,
        longitude: float,
        accuracy: float,
        device_uuid: str,
    ):
        from datetime import datetime, timezone
        from app.core.security import decode_access_token
        from app.services.gamification_service import GamificationService
        from app.services.system_config_service import SystemConfigService
        from app.repositories.geofence_repo import GeofenceRepository
        from app.utils.geofencing import GPSCoordinate, calculate_haversine_distance, is_within_geofence
        from app.api.ws import manager
        from app.schemas.student import StudentSmartPassScanResponse

        payload = decode_access_token(qr_token)
        if not payload or payload.get("type") != "teacher_smart_pass":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired Teacher Smart Pass QR code. Please scan the current code displayed on the screen.",
            )

        session_id = payload.get("session_id")
        if not session_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Corrupted QR pass token payload.")

        session = await db.session.find_unique(
            where={"id": session_id},
            include={"academicClass": {"include": {"subject": True, "teacher": {"include": {"user": True}}}}},
        )
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance session not found.")

        now = datetime.now(timezone.utc)
        sess_end = session.endTime.replace(tzinfo=timezone.utc) if session.endTime.tzinfo is None else session.endTime
        if not session.isActive or sess_end <= now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Attendance session is closed or has expired."
            )

        enrollment = await db.enrollment.find_first(
            where={"studentId": student.id, "academicClassId": session.academicClassId}
        )
        if not enrollment:
            class_title = session.academicClass.name if session.academicClass else "this class"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Student {student.enrollmentNumber} is not enrolled in {class_title}.",
            )

        # Device Binding Check
        if student.deviceUuid:
            if student.deviceUuid != device_uuid:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Device mismatch: This student profile is bound to another device. Please submit a Device Change Request.",
                )
        else:
            await db.student.update(where={"id": student.id}, data={"deviceUuid": device_uuid})

        # Geofence Validation
        config = await SystemConfigService().get_config()
        if config.isGpsVerificationEnabled:
            geofence = await GeofenceRepository().get_by_class_id(session.academicClassId)
            if geofence:
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
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Location verification failed: Outside geofence by {distance - effective_radius:.1f}m.",
                    )

        student_name = f"{student.firstName or ''} {student.lastName or ''}".strip() or "Student"
        class_name = session.academicClass.name if session.academicClass else "Class"
        subject_name = (
            session.academicClass.subject.name
            if session.academicClass and session.academicClass.subject
            else class_name
        )

        existing = await db.attendance.find_first(where={"studentId": student.id, "sessionId": session_id})

        marked_time = now.isoformat()
        if existing and existing.status == "Present":
            return StudentSmartPassScanResponse(
                status="already_marked",
                session_id=session_id,
                class_name=class_name,
                subject=subject_name,
                attendance_status="Present",
                student_name=student_name,
                enrollment_number=student.enrollmentNumber,
                marked_at=existing.createdAt.isoformat() if existing.createdAt else marked_time,
                message=f"Attendance already marked Present for {class_name}.",
            )

        if existing:
            await db.attendance.update(
                where={"id": existing.id},
                data={
                    "status": "Present",
                    "finalAiScore": 1.0,
                    "gpsLatitude": latitude,
                    "gpsLongitude": longitude,
                    "remarks": "Verified via Teacher Smart Pass QR",
                },
            )
        else:
            await db.attendance.create(
                data={
                    "studentId": student.id,
                    "sessionId": session_id,
                    "status": "Present",
                    "faceScore": 1.0,
                    "livenessScore": 1.0,
                    "backgroundScore": 1.0,
                    "finalAiScore": 1.0,
                    "gpsLatitude": latitude,
                    "gpsLongitude": longitude,
                    "remarks": "Verified via Teacher Smart Pass QR",
                }
            )

        try:
            await GamificationService().recalculate_student_streak(student.id)
        except Exception as streak_err:
            logger.warning("Failed recalculating student streak for %s: %s", student.id, streak_err)

        try:
            msg = {
                "type": "attendance_updated",
                "session_id": session_id,
                "status": "Present",
                "student_id": student.id,
                "student_name": student_name,
                "enrollment_number": student.enrollmentNumber,
            }
            await manager.send_personal_message(msg, student_id=student.id)
            tid = (
                session.academicClass.tenantId
                if (session.academicClass and hasattr(session.academicClass, "tenantId"))
                else None
            )
            await manager.broadcast_to_teachers(msg, tenant_id=tid)
        except Exception as ws_err:
            logger.warning("Failed broadcasting attendance update for %s: %s", student.id, ws_err)

        try:
            await db.auditlog.create(
                data={
                    "eventType": "SMART_PASS_SCAN_VERIFY",
                    "severity": "INFO",
                    "actor": student.user.email if student.user and student.user.email else student.enrollmentNumber,
                    "target": f"session:{session_id}",
                    "description": f"Student {student_name} ({student.enrollmentNumber}) verified via Teacher Smart Pass QR for {class_name}",
                }
            )
        except Exception as audit_err:
            logger.warning("Failed creating audit log for smart pass scan (%s): %s", student.id, audit_err)

        return StudentSmartPassScanResponse(
            status="success",
            session_id=session_id,
            class_name=class_name,
            subject=subject_name,
            attendance_status="Present",
            student_name=student_name,
            enrollment_number=student.enrollmentNumber,
            marked_at=marked_time,
            message=f"Attendance marked Present for {class_name} ({subject_name}).",
        )
