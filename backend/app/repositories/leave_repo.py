"""Backward-compatibility alias for app.repositories.leave_repository."""

from app.repositories.leave_repository import *  # noqa: F401, F403
from app.repositories.leave_repository import LeaveRepository  # noqa: F401

__all__ = ["LeaveRepository"]
