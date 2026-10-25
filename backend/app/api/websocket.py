import asyncio
import json
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.api.dependencies import get_current_user_from_token
from app.core.logging_config import get_logger

logger = get_logger("app.websocket")
router = APIRouter(prefix="/ws", tags=["WebSocket"])
_PING_INTERVAL = 25
_PONG_TIMEOUT = 15


class ConnectionManager:
    def __init__(self):
        self.user_connections: Dict[str, Set[WebSocket]] = {}
        self.role_connections: Dict[str, Set[WebSocket]] = {"STUDENT": set(), "TEACHER": set(), "ADMIN": set()}
        self.student_connections: Dict[str, Set[WebSocket]] = {}
        self.teacher_connections: Dict[str, Set[WebSocket]] = {}
        self.tenant_connections: Dict[str, Set[WebSocket]] = {}
        self._heartbeat_task: asyncio.Task | None = None

    async def connect_client(
        self,
        websocket: WebSocket,
        user_id: str,
        role: str,
        profile_id: str | None = None,
        tenant_id: str | None = None,
        tenant_slug: str | None = None,
    ):
        self.user_connections.setdefault(user_id, set()).add(websocket)
        self.role_connections.setdefault(role, set()).add(websocket)
        if role == "STUDENT" and profile_id:
            self.student_connections.setdefault(profile_id, set()).add(websocket)
        elif role == "TEACHER" and profile_id:
            self.teacher_connections.setdefault(profile_id, set()).add(websocket)
        if tenant_id:
            self.tenant_connections.setdefault(tenant_id, set()).add(websocket)
        if tenant_slug:
            self.tenant_connections.setdefault(tenant_slug, set()).add(websocket)

    def disconnect_client(
        self,
        websocket: WebSocket,
        user_id: str,
        role: str,
        profile_id: str | None = None,
        tenant_id: str | None = None,
        tenant_slug: str | None = None,
    ):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        if role in self.role_connections:
            self.role_connections[role].discard(websocket)
        if role == "STUDENT" and profile_id and profile_id in self.student_connections:
            self.student_connections[profile_id].discard(websocket)
            if not self.student_connections[profile_id]:
                del self.student_connections[profile_id]
        elif role == "TEACHER" and profile_id and profile_id in self.teacher_connections:
            self.teacher_connections[profile_id].discard(websocket)
            if not self.teacher_connections[profile_id]:
                del self.teacher_connections[profile_id]
        if tenant_id and tenant_id in self.tenant_connections:
            self.tenant_connections[tenant_id].discard(websocket)
            if not self.tenant_connections[tenant_id]:
                del self.tenant_connections[tenant_id]
        if tenant_slug and tenant_slug in self.tenant_connections:
            self.tenant_connections[tenant_slug].discard(websocket)
            if not self.tenant_connections[tenant_slug]:
                del self.tenant_connections[tenant_slug]

    async def deliver_personal_message(self, message: dict, target_id: str):
        conns = (
            self.user_connections.get(target_id)
            or self.student_connections.get(target_id)
            or self.teacher_connections.get(target_id)
            or set()
        )
        for connection in list(conns):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.debug("Personal message delivery failed, discarded stale socket for %s: %s", target_id, e)
                conns.discard(connection)

    async def deliver_broadcast(self, message: dict, target_role: str | None = None, tenant_id: str | None = None):
        targets: Set[WebSocket] = set()
        if target_role and target_role in self.role_connections:
            targets.update(self.role_connections[target_role])
        else:
            for role_set in self.role_connections.values():
                targets.update(role_set)
        if tenant_id and tenant_id in self.tenant_connections:
            targets = targets.intersection(self.tenant_connections[tenant_id])
        for conn in list(targets):
            try:
                await conn.send_json(message)
            except Exception as e:
                logger.debug("Broadcast socket send failed, discarded stale connection: %s", e)
                for s in self.role_connections.values():
                    s.discard(conn)
                for s in self.tenant_connections.values():
                    s.discard(conn)

    async def send_personal_message(self, message: dict, target_id: str | None = None, student_id: str | None = None):
        tid = target_id or student_id
        if not tid:
            return
        await self.deliver_personal_message(message, tid)
        from app.services.realtime_bus import realtime_bus

        asyncio.create_task(realtime_bus.publish("personal", message, target_id=tid))

    async def broadcast(self, message: dict, target_role: str | None = None, tenant_id: str | None = None):
        await self.deliver_broadcast(message, target_role, tenant_id=tenant_id)
        from app.services.realtime_bus import realtime_bus

        asyncio.create_task(realtime_bus.publish("broadcast", message, target_role=target_role, tenant_id=tenant_id))

    async def broadcast_to_teachers(self, message: dict, tenant_id: str | None = None):
        await self.broadcast(message, target_role="TEACHER", tenant_id=tenant_id)

    async def _heartbeat_loop(self):
        while True:
            await asyncio.sleep(_PING_INTERVAL)
            for conns in list(self.role_connections.values()):
                for conn in list(conns):
                    try:
                        await asyncio.wait_for(conn.send_json({"type": "ping"}), timeout=_PONG_TIMEOUT)
                    except Exception:
                        conns.discard(conn)

    def start_heartbeat(self):
        if self._heartbeat_task is None:
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        from app.services.realtime_bus import realtime_bus

        realtime_bus.start_listener(self)

    def stop_heartbeat(self):
        if self._heartbeat_task is not None:
            self._heartbeat_task.cancel()
            self._heartbeat_task = None
        from app.services.realtime_bus import realtime_bus

        realtime_bus.stop_listener()

    async def force_close_tenant(self, tenant_id: str, reason: str) -> None:
        sockets = list(self.tenant_connections.get(tenant_id, set()))
        for ws in sockets:
            try:
                await ws.send_json({"type": "tenant_suspended", "message": reason})
                await ws.close(code=4403)
            except Exception:
                pass
        self.tenant_connections.pop(tenant_id, None)
        dead = set(sockets)
        for role_set in self.role_connections.values():
            role_set.difference_update(sockets)
        for uid, conns in list(self.user_connections.items()):
            conns.difference_update(dead)
            if not conns:
                del self.user_connections[uid]


manager = ConnectionManager()


@router.websocket("/connect")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await websocket.accept()
        auth_data = await websocket.receive_text()
        auth_json = json.loads(auth_data)
        if auth_json.get("type") != "auth" or not auth_json.get("token"):
            await websocket.close(code=1008, reason="Authentication required")
            return
        user = await get_current_user_from_token(auth_json["token"])
        if not user:
            await websocket.close(code=1008, reason="Unauthorized")
            return
        student_obj = getattr(user, "student", None)
        teacher_obj = getattr(user, "teacher", None)
        profile_id = (
            student_obj.id
            if (user.role == "STUDENT" and student_obj)
            else (teacher_obj.id if (user.role == "TEACHER" and teacher_obj) else None)
        )
        tenant_id = getattr(user, "tenantId", None)
        tenant_obj = getattr(user, "tenant", None)
        tenant_slug = tenant_obj.slug if tenant_obj else None
        if user.role != "SUPER_ADMIN" and tenant_obj and tenant_obj.status != "ACTIVE":
            await websocket.send_json(
                {"type": "tenant_suspended", "message": f"Institution '{tenant_obj.name}' is currently suspended."}
            )
            await websocket.close(code=4403, reason="Tenant suspended")
            return
        await manager.connect_client(
            websocket, user.id, user.role, profile_id, tenant_id=tenant_id, tenant_slug=tenant_slug
        )
        await websocket.send_json(
            {
                "type": "connected",
                "message": "WebSocket connection established",
                "user_id": user.id,
                "role": user.role.lower(),
            }
        )
        try:
            while True:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=_PING_INTERVAL)
                if data == "ping" or '"type":"ping"' in data:
                    await websocket.send_json({"type": "pong"})
        except (asyncio.TimeoutError, WebSocketDisconnect):
            pass
        finally:
            manager.disconnect_client(
                websocket, user.id, user.role, profile_id, tenant_id=tenant_id, tenant_slug=tenant_slug
            )
    except Exception as e:
        logger.error("WebSocket error: %s", e, exc_info=True)
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except Exception:
            pass
