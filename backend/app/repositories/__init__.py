"""Database repository modules.

Exposes domain repositories for clean data-access separation.
"""

from app.repositories.attendance_repository import AttendanceRepository
from app.repositories.class_repository import ClassRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.geofence_repository import GeofenceRepository
from app.repositories.leave_repository import LeaveRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.system_config_repository import SystemConfigRepository
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.user_repository import UserRepository

__all__ = [
    "AttendanceRepository",
    "ClassRepository",
    "EnrollmentRepository",
    "GeofenceRepository",
    "LeaveRepository",
    "SessionRepository",
    "StudentRepository",
    "SystemConfigRepository",
    "TeacherRepository",
    "UserRepository",
]
