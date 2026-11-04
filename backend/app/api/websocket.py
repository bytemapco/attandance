import asyncio
import json
from dataclasses import dataclass
from typing import Optional

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from prisma.models import User

from app.api.dependencies import get_current_user_from_token
from app.core.logging_config import get_logger
from app.db.client import db
from app.services.connection_manager import PING_INTERVAL_SECONDS, TENANT_SUSPENDED_CLOSE_CODE, manager

logger = get_logger("app.websocket")
router = APIRouter(prefix="/ws", tags=["WebSocket"])

POLICY_VIOLATION_CLOSE_CODE = 1008
INTERNAL_ERROR_CLOSE_CODE = 1011
AUTH_TIMEOUT_SECONDS = 10


@dataclass(frozen=True)
class Identity:
    user: User
    profile_id: Optional[str]
    tenant_id: Optional[str]
    tenant_slug: Optional[str]


async def _authenticate(websocket: WebSocket) -> Optional[User]:
    """Reads the first message, which must carry a login token. Closes the socket and returns None otherwise."""
    try:
        first = json.loads(await asyncio.wait_for(websocket.receive_text(), timeout=AUTH_TIMEOUT_SECONDS))
    except (asyncio.TimeoutError, ValueError):
        await websocket.close(code=POLICY_VIOLATION_CLOSE_CODE, reason="Authentication required")
        return None
    if not isinstance(first, dict) or first.get("type") != "auth" or not first.get("token"):
        await websocket.close(code=POLICY_VIOLATION_CLOSE_CODE, reason="Authentication required")
        return None
    try:
        return await get_current_user_from_token(first["token"])
    except HTTPException:
        await websocket.close(code=POLICY_VIOLATION_CLOSE_CODE, reason="Unauthorized")
        return None


async def _profile_id(user: User) -> Optional[str]:
    if user.role == "STUDENT":
        record = await db.student.find_unique(where={"userId": user.id})
    elif user.role == "TEACHER":
        record = await db.teacher.find_unique(where={"userId": user.id})
    else:
        return None
    return record.id if record else None


async def _serve(websocket: WebSocket, identity: Identity) -> None:
    """Answers pings until the client goes quiet or leaves."""
    try:
        while True:
            data = await asyncio.wait_for(websocket.receive_text(), timeout=PING_INTERVAL_SECONDS)
            if data == "ping" or '"type":"ping"' in data:
                await websocket.send_json({"type": "pong"})
    except (asyncio.TimeoutError, WebSocketDisconnect):
        return
    finally:
        user = identity.user
        manager.disconnect_client(
            websocket, user.id, user.role, identity.profile_id,
            tenant_id=identity.tenant_id, tenant_slug=identity.tenant_slug,
        )


@router.websocket("/connect")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        user = await _authenticate(websocket)
        if not user:
            return
        tenant = await db.tenant.find_unique(where={"id": user.tenantId}) if user.tenantId else None
        if user.role != "SUPER_ADMIN" and tenant and tenant.status != "ACTIVE":
            await websocket.send_json(
                {"type": "tenant_suspended", "message": f"Institution '{tenant.name}' is currently suspended."}
            )
            await websocket.close(code=TENANT_SUSPENDED_CLOSE_CODE, reason="Tenant suspended")
            return
        identity = Identity(user, await _profile_id(user), user.tenantId, tenant.slug if tenant else None)
        await manager.connect_client(
            websocket, user.id, user.role, identity.profile_id,
            tenant_id=identity.tenant_id, tenant_slug=identity.tenant_slug,
        )
        await websocket.send_json(
            {
                "type": "connected",
                "message": "WebSocket connection established",
                "user_id": user.id,
                "role": user.role.lower(),
            }
        )
        await _serve(websocket, identity)
    except Exception as exc:
        logger.error("WebSocket error: %s", exc, exc_info=True)
        try:
            await websocket.close(code=INTERNAL_ERROR_CLOSE_CODE, reason="Internal server error")
        except Exception as close_error:
            logger.debug("Socket was already closed: %s", close_error)
