"""Saved chats. A person sees only their own, and only inside their institution."""
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import status
from fastapi.encoders import jsonable_encoder
from prisma import Json

from app.db.client import db
from app.services.agent.access import refuse
from app.services.agent.types import Principal

HISTORY_MESSAGES = 20
TITLE_LENGTH = 60


def _mine(principal: Principal, conversation_id: str) -> dict[str, str]:
    return {"id": conversation_id, "tenantId": principal.tenant_id, "userId": principal.user_id}


async def open_conversation(principal: Principal, conversation_id: Optional[str], first_message: str):
    if conversation_id:
        conversation = await db.agentconversation.find_first(where=_mine(principal, conversation_id))
        if not conversation:
            raise refuse(status.HTTP_404_NOT_FOUND, "Conversation not found.")
        return conversation
    return await db.agentconversation.create(
        data={
            "tenantId": principal.tenant_id,
            "userId": principal.user_id,
            "title": first_message.strip()[:TITLE_LENGTH],
        }
    )


async def history(conversation_id: str) -> list[dict[str, Any]]:
    """The last few turns as plain text. Tool results from earlier turns are not replayed."""
    rows = await db.agentmessage.find_many(
        where={"conversationId": conversation_id}, order={"createdAt": "desc"}, take=HISTORY_MESSAGES
    )
    return [{"role": "user" if r.role == "user" else "model", "text": r.content, "raw": None} for r in reversed(rows)]


async def add_message(principal: Principal, conversation_id: str, role: str, content: str, events: list | None = None):
    data: dict[str, Any] = {
        "tenantId": principal.tenant_id,
        "conversationId": conversation_id,
        "role": role,
        "content": content,
    }
    if events:
        data["events"] = Json(jsonable_encoder(events))
    await db.agentmessage.create(data=data)
    await db.agentconversation.update(where={"id": conversation_id}, data={"updatedAt": datetime.now(timezone.utc)})


async def list_conversations(principal: Principal, limit: int = 30) -> list[dict[str, Any]]:
    rows = await db.agentconversation.find_many(
        where={"tenantId": principal.tenant_id, "userId": principal.user_id}, order={"updatedAt": "desc"}, take=limit
    )
    return [{"id": r.id, "title": r.title or "New chat", "updated_at": r.updatedAt} for r in rows]


async def messages(principal: Principal, conversation_id: str) -> list[dict[str, Any]]:
    if not await db.agentconversation.find_first(where=_mine(principal, conversation_id)):
        raise refuse(status.HTTP_404_NOT_FOUND, "Conversation not found.")
    rows = await db.agentmessage.find_many(where={"conversationId": conversation_id}, order={"createdAt": "asc"})
    return [{"role": r.role, "content": r.content, "events": r.events or [], "created_at": r.createdAt} for r in rows]


async def delete(principal: Principal, conversation_id: str) -> None:
    removed = await db.agentconversation.delete_many(where=_mine(principal, conversation_id))
    if removed != 1:
        raise refuse(status.HTTP_404_NOT_FOUND, "Conversation not found.")
