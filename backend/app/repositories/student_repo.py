"""Backward-compatibility alias for app.repositories.student_repository."""

from app.repositories.student_repository import *  # noqa: F401, F403
from app.repositories.student_repository import StudentRepository  # noqa: F401

__all__ = ["StudentRepository"]
