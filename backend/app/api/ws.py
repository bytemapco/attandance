"""WebSocket router backward-compatibility shim.

Use app.api.websocket instead of app.api.ws.
"""

from app.api.websocket import ConnectionManager, manager, router  # noqa: F401

__all__ = ["ConnectionManager", "manager", "router"]
