"""Backward-compatibility alias for app.repositories.geofence_repository."""

from app.repositories.geofence_repository import *  # noqa: F401, F403
from app.repositories.geofence_repository import GeofenceRepository  # noqa: F401

__all__ = ["GeofenceRepository"]
