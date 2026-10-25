from app.core.logging_config import get_logger
from app.api.ws import manager
from app.db.client import db
from app.repositories.student_repo import StudentRepository
from app.repositories.class_repo import ClassRepository
from app.repositories.teacher_repo import TeacherRepository

logger = get_logger("app.attendance.notifier")


class AttendanceNotifier:
    def __init__(self) -> None:
        self.student_repo = StudentRepository()
        self.class_repo = ClassRepository()
        self.teacher_repo = TeacherRepository()

    async def broadcast_attendance_update(self, session_id: str, student_id: str, status: str) -> None:
        try:
            msg = {"type": "attendance_updated", "session_id": session_id, "status": status}
            await manager.send_personal_message(msg, student_id=student_id)
            msg["student_id"] = student_id

            # Resolve tenant isolation for teacher broadcast
            tenant_id = None
            sess = await db.session.find_unique(
                where={"id": session_id},
                include={"academicClass": True},
            )
            if sess and sess.academicClass:
                tenant_id = sess.academicClass.tenantId

            await manager.broadcast_to_teachers(msg, tenant_id=tenant_id)
        except Exception as e:
            logger.warning("WebSocket broadcast failed: %s", e)

    async def dispatch_flagged_notifications(self, student_id: str, class_id: str, attendance_id: str) -> None:
        try:
            from app.services.notification_service import notify_teacher_attendance_flagged

            student = await self.student_repo.get_by_id(student_id)
            ac = await self.class_repo.get_by_id(class_id)
            class_name = ac.name if ac else "your class"
            student_name = (
                f"{student.firstName or ''} {student.lastName or ''}".strip() or "Student" if student else "Student"
            )

            if ac and ac.teacherId:
                teacher = await self.teacher_repo.get_by_id(ac.teacherId)
                if teacher and teacher.userId:
                    await notify_teacher_attendance_flagged(teacher.userId, student_name, class_name, attendance_id)
        except Exception as e:
            logger.warning("Attendance flagged notification failed: %s", e)
