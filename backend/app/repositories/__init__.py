"""Database repository modules.

Exposes domain repositories for clean data-access separation.
"""

from app.repositories.leave_repository import LeaveRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.system_config_repository import SystemConfigRepository
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.user_repository import UserRepository

__all__ = [
    "LeaveRepository",
    "StudentRepository",
    "SystemConfigRepository",
    "TeacherRepository",
    "UserRepository",
]
