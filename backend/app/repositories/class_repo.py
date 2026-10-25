"""Backward-compatibility alias for app.repositories.class_repository."""

from app.repositories.class_repository import *  # noqa: F401, F403
from app.repositories.class_repository import ClassRepository  # noqa: F401

__all__ = ["ClassRepository"]
