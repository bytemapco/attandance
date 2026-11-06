"""The record of everything the model tried to do, kept whether it worked, failed or was refused."""
from typing import Any, Optional

from prisma import Json

from app.db.client import db
from app.services.agent.types import Principal

DETAIL_LIMIT = 500


async def log_tool_call(
    principal: Principal,
    tool_name: str,
    arguments: dict[str, Any],
    outcome: str,
    detail: Optional[str] = None,
    duration_ms: int = 0,
    conversation_id: Optional[str] = None,
) -> None:
    await db.agenttoolcall.create(
        data={
            "tenantId": principal.tenant_id,
            "userId": principal.user_id,
            "conversationId": conversation_id,
            "toolName": tool_name,
            "arguments": Json(arguments),
            "outcome": outcome,
            "detail": detail[:DETAIL_LIMIT] if detail else None,
            "durationMs": duration_ms,
        }
    )
