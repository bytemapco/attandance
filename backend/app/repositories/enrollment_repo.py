"""Backward-compatibility alias for app.repositories.enrollment_repository."""

from app.repositories.enrollment_repository import *  # noqa: F401, F403
from app.repositories.enrollment_repository import EnrollmentRepository  # noqa: F401

__all__ = ["EnrollmentRepository"]
