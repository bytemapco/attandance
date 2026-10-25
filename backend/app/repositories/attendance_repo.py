"""Backward-compatibility alias for app.repositories.attendance_repository."""

from app.repositories.attendance_repository import *  # noqa: F401, F403
from app.repositories.attendance_repository import AttendanceRepository  # noqa: F401

__all__ = ["AttendanceRepository"]
