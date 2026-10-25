"""Backward-compatibility alias for app.repositories.teacher_repository."""

from app.repositories.teacher_repository import *  # noqa: F401, F403
from app.repositories.teacher_repository import TeacherRepository  # noqa: F401

__all__ = ["TeacherRepository"]
