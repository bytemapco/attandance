import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from prisma.models import Session

from app.api.websocket import manager
from app.core.logging_config import get_logger
from app.core.security import create_access_token, decode_access_token
from app.db.client import db
from app.schemas.teacher import SessionWithClassResponse, SmartPassVerifyResponse, TeacherSmartPassResponse
from app.services.gamification_service import GamificationService
from app.services.session_service import SessionService

logger = get_logger("app.teacher.session")


class TeacherSessionService:
    @staticmethod
    def _resolve_full_name(first: Optional[str], last: Optional[str]) -> str:
        return f"{first or ''} {last or ''}".strip() or "—"

    @staticmethod
    async def get_session_with_auth(session_id: str, teacher_id: str) -> Session:
        session = await db.session.find_unique(where={"id": session_id}, include={"academicClass": True})
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance Session not found.")
        if session.academicClass.teacherId != teacher_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You do not teach this academic class.")
        return session

    @classmethod
    async def get_teacher_sessions(cls, teacher_id: str) -> List[SessionWithClassResponse]:
        sessions = await db.session.find_many(
            where={"academicClass": {"teacherId": teacher_id}},
            include={"academicClass": {"include": {"subject": True}}},
            order={"endTime": "desc"},
        )
        now = datetime.now(timezone.utc)
        expired_ids = [s.id for s in sessions if s.isActive and (s.endTime.replace(tzinfo=timezone.utc) if s.endTime.tzinfo is None else s.endTime) <= now]
        if expired_ids:
            session_service = SessionService()
            for s_id in expired_ids:
                try:
                    await session_service.close_session(s_id)
                except Exception as e:
                    logger.warning("Failed to close expired session %s: %s", s_id, e)

        return [
            SessionWithClassResponse(
                id=s.id,
                academicClassId=s.academicClassId,
                class_name=s.academicClass.name,
                subject=s.academicClass.subject.name if s.academicClass and s.academicClass.subject else "—",
                startTime=s.startTime,
                endTime=s.endTime,
                isActive=s.isActive and (s.endTime.replace(tzinfo=timezone.utc) if s.endTime.tzinfo is None else s.endTime) > now,
            )
            for s in sessions
        ]

    @classmethod
    async def _record_smart_pass_attendance(cls, student_id: str, session_id: str, existing_id: Optional[str]) -> None:
        if existing_id:
            await db.attendance.update(where={"id": existing_id}, data={"status": "Present", "finalAiScore": 1.0, "remarks": "Verified via Smart Pass QR"})
        else:
            await db.attendance.create(data={"studentId": student_id, "sessionId": session_id, "status": "Present", "faceScore": 1.0, "livenessScore": 1.0, "backgroundScore": 1.0, "finalAiScore": 1.0, "gpsLatitude": 0.0, "gpsLongitude": 0.0, "remarks": "Verified via Smart Pass QR"})

    @classmethod
    async def verify_smart_pass(cls, teacher_id: str, teacher_user_id: str, session_id: str, qr_token: str) -> SmartPassVerifyResponse:
        payload = decode_access_token(qr_token)
        if not payload or payload.get("type") != "smart_pass":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired Smart Pass QR token. Please refresh the QR code on the student app.")

        student_id, user_sub = payload.get("student_id"), payload.get("sub")
        where_filter = {"id": student_id} if student_id else ({"userId": user_sub} if user_sub else None)
        if not where_filter:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid QR token data.")

        student = await db.student.find_unique(where=where_filter, include={"user": True})
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile matching QR not found.")

        session = await cls.get_session_with_auth(session_id, teacher_id)
        now = datetime.now(timezone.utc)
        sess_end = session.endTime.replace(tzinfo=timezone.utc) if session.endTime.tzinfo is None else session.endTime
        if not session.isActive or sess_end <= now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is closed or has expired.")

        enrollment = await db.enrollment.find_first(where={"studentId": student.id, "academicClassId": session.academicClassId})
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Student {student.enrollmentNumber} is not enrolled in {session.academicClass.name}.")

        student_name = cls._resolve_full_name(student.firstName, student.lastName)
        existing = await db.attendance.find_first(where={"studentId": student.id, "sessionId": session_id})
        if existing and existing.status == "Present":
            return SmartPassVerifyResponse(
                status="already_marked",
                student_id=student.id,
                student_name=student_name,
                enrollment_number=student.enrollmentNumber,
                attendance_status="Present",
                session_id=session_id,
                message=f"Attendance already marked Present for {student_name} ({student.enrollmentNumber}).",
            )

        await cls._record_smart_pass_attendance(student.id, session_id, existing.id if existing else None)
        try:
            await GamificationService().recalculate_student_streak(student.id)
        except Exception as e:
            logger.warning("Streak calculation failed: %s", e)

        try:
            msg = {"type": "attendance_updated", "session_id": session_id, "status": "Present", "student_id": student.id}
            await manager.send_personal_message(msg, student_id=student.id)
            await manager.broadcast_to_teachers(msg)
        except Exception as ws_err:
            logger.warning("Failed broadcasting attendance update in smart pass verify for %s: %s", student.id, ws_err)

        try:
            await db.auditlog.create(data={"eventType": "SMART_PASS_VERIFY", "severity": "INFO", "actor": teacher_user_id, "target": f"student:{student.enrollmentNumber}", "description": f"Verified student {student_name} ({student.enrollmentNumber}) via Smart Pass QR for session {session_id}"})
        except Exception as audit_err:
            logger.warning("Failed creating audit log for smart pass verify for %s: %s", student.id, audit_err)

        return SmartPassVerifyResponse(
            status="success",
            student_id=student.id,
            student_name=student_name,
            enrollment_number=student.enrollmentNumber,
            attendance_status="Present",
            session_id=session_id,
            message=f"Successfully verified {student_name} ({student.enrollmentNumber}).",
        )

    @classmethod
    async def generate_session_smart_pass(cls, teacher_id: str, teacher_user_id: str, session_id: str) -> TeacherSmartPassResponse:
        session = await cls.get_session_with_auth(session_id, teacher_id)
        now = datetime.now(timezone.utc)
        sess_end = session.endTime.replace(tzinfo=timezone.utc) if session.endTime.tzinfo is None else session.endTime
        if not session.isActive or sess_end <= now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is closed or has expired.")

        class_name = session.academicClass.name if session.academicClass else "Class"
        subject_name = session.academicClass.subject.name if session.academicClass and session.academicClass.subject else class_name
        expires_delta = timedelta(seconds=15)
        qr_token = create_access_token(
            subject=teacher_user_id,
            role="TEACHER",
            expires_delta=expires_delta,
            extra_data={"session_id": session.id, "academic_class_id": session.academicClassId, "teacher_id": teacher_id, "type": "teacher_smart_pass", "nonce": uuid.uuid4().hex[:12]},
        )
        return TeacherSmartPassResponse(
            qr_token=qr_token,
            session_id=session.id,
            class_name=class_name,
            subject=subject_name,
            expires_at=(now + expires_delta).isoformat(),
            refresh_interval_seconds=5,
        )
