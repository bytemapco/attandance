"""Backward-compatibility alias for app.repositories.user_repository."""

from app.repositories.user_repository import *  # noqa: F401, F403
from app.repositories.user_repository import UserRepository  # noqa: F401

__all__ = ["UserRepository"]
