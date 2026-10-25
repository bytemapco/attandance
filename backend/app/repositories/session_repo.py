"""Backward-compatibility alias for app.repositories.session_repository."""

from app.repositories.session_repository import *  # noqa: F401, F403
from app.repositories.session_repository import SessionRepository  # noqa: F401

__all__ = ["SessionRepository"]
