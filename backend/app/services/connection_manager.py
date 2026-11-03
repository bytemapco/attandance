"""Open WebSocket connections, grouped by user, role, profile and institution, and how messages reach them."""
import asyncio
from typing import Dict, Optional, Set

from fastapi import WebSocket

from app.core.logging_config import get_logger
from app.services.realtime_bus import realtime_bus

logger = get_logger("app.websocket")

PING_INTERVAL_SECONDS = 25
PONG_TIMEOUT_SECONDS = 15
TENANT_SUSPENDED_CLOSE_CODE = 4403

SocketIndex = Dict[str, Set[WebSocket]]


def _add(index: SocketIndex, key: str, socket: WebSocket) -> None:
    index.setdefault(key, set()).add(socket)


def _remove(index: SocketIndex, key: str, socket: WebSocket) -> None:
    """Drops the socket from `key`, and the key itself once nobody is left."""
    sockets = index.get(key)
    if sockets is None:
        return
    sockets.discard(socket)
    if not sockets:
        del index[key]


class ConnectionManager:
    def __init__(self) -> None:
        self.user_connections: SocketIndex = {}
        self.role_connections: SocketIndex = {"STUDENT": set(), "TEACHER": set(), "ADMIN": set()}
        self.student_connections: SocketIndex = {}
        self.teacher_connections: SocketIndex = {}
        self.tenant_connections: SocketIndex = {}
        self._heartbeat_task: Optional[asyncio.Task] = None

    def _profile_index(self, role: str) -> Optional[SocketIndex]:
        return {"STUDENT": self.student_connections, "TEACHER": self.teacher_connections}.get(role)

    async def connect_client(
        self,
        websocket: WebSocket,
        user_id: str,
        role: str,
        profile_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        tenant_slug: Optional[str] = None,
    ) -> None:
        _add(self.user_connections, user_id, websocket)
        self.role_connections.setdefault(role, set()).add(websocket)
        profiles = self._profile_index(role)
        if profiles is not None and profile_id:
            _add(profiles, profile_id, websocket)
        for tenant_key in (tenant_id, tenant_slug):
            if tenant_key:
                _add(self.tenant_connections, tenant_key, websocket)

    def disconnect_client(
        self,
        websocket: WebSocket,
        user_id: str,
        role: str,
        profile_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        tenant_slug: Optional[str] = None,
    ) -> None:
        _remove(self.user_connections, user_id, websocket)
        if role in self.role_connections:
            self.role_connections[role].discard(websocket)
        profiles = self._profile_index(role)
        if profiles is not None and profile_id:
            _remove(profiles, profile_id, websocket)
        for tenant_key in (tenant_id, tenant_slug):
            if tenant_key:
                _remove(self.tenant_connections, tenant_key, websocket)

    def _forget(self, websocket: WebSocket) -> None:
        """Removes a socket that failed to send from every index."""
        for sockets in self.role_connections.values():
            sockets.discard(websocket)
        for index in (self.user_connections, self.student_connections, self.teacher_connections, self.tenant_connections):
            for key in list(index):
                _remove(index, key, websocket)

    async def deliver_personal_message(self, message: dict, target_id: str) -> None:
        sockets = (
            self.user_connections.get(target_id)
            or self.student_connections.get(target_id)
            or self.teacher_connections.get(target_id)
            or set()
        )
        for connection in list(sockets):
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.debug("Personal message delivery failed, discarded stale socket for %s: %s", target_id, exc)
                self._forget(connection)

    async def deliver_broadcast(self, message: dict, target_role: Optional[str] = None, tenant_id: Optional[str] = None) -> None:
        targets: Set[WebSocket] = set()
        if target_role and target_role in self.role_connections:
            targets.update(self.role_connections[target_role])
        else:
            for sockets in self.role_connections.values():
                targets.update(sockets)
        if tenant_id and tenant_id in self.tenant_connections:
            targets &= self.tenant_connections[tenant_id]
        for connection in list(targets):
            try:
                await connection.send_json(message)
            except Exception as exc:
                logger.debug("Broadcast socket send failed, discarded stale connection: %s", exc)
                self._forget(connection)

    async def send_personal_message(self, message: dict, target_id: Optional[str] = None, student_id: Optional[str] = None) -> None:
        recipient = target_id or student_id
        if not recipient:
            return
        await self.deliver_personal_message(message, recipient)
        asyncio.create_task(realtime_bus.publish("personal", message, target_id=recipient))

    async def broadcast(self, message: dict, target_role: Optional[str] = None, tenant_id: Optional[str] = None) -> None:
        await self.deliver_broadcast(message, target_role, tenant_id=tenant_id)
        asyncio.create_task(realtime_bus.publish("broadcast", message, target_role=target_role, tenant_id=tenant_id))

    async def broadcast_to_teachers(self, message: dict, tenant_id: Optional[str] = None) -> None:
        await self.broadcast(message, target_role="TEACHER", tenant_id=tenant_id)

    async def _heartbeat_loop(self) -> None:
        while True:
            await asyncio.sleep(PING_INTERVAL_SECONDS)
            for sockets in list(self.role_connections.values()):
                for connection in list(sockets):
                    try:
                        await asyncio.wait_for(connection.send_json({"type": "ping"}), timeout=PONG_TIMEOUT_SECONDS)
                    except Exception as exc:
                        logger.debug("Dropped a socket that did not answer the heartbeat: %s", exc)
                        self._forget(connection)

    def start_heartbeat(self) -> None:
        if self._heartbeat_task is None:
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        realtime_bus.start_listener(self)

    def stop_heartbeat(self) -> None:
        if self._heartbeat_task is not None:
            self._heartbeat_task.cancel()
            self._heartbeat_task = None
        realtime_bus.stop_listener()

    async def force_close_tenant(self, tenant_id: str, reason: str) -> None:
        for connection in list(self.tenant_connections.get(tenant_id, set())):
            try:
                await connection.send_json({"type": "tenant_suspended", "message": reason})
                await connection.close(code=TENANT_SUSPENDED_CLOSE_CODE)
            except Exception as exc:
                logger.debug("Could not notify a socket of the suspension: %s", exc)
            self._forget(connection)


manager = ConnectionManager()
