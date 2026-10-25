"""Backward-compatibility alias for app.repositories.system_config_repository."""

from app.repositories.system_config_repository import *  # noqa: F401, F403
from app.repositories.system_config_repository import SystemConfigRepository  # noqa: F401

__all__ = ["SystemConfigRepository"]
