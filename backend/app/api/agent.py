"""The assistant for teachers and institution admins: chat, saved conversations and confirming prepared changes."""
import json
from typing import Any, AsyncIterator, Optional

from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from prisma.models import User
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_user
from app.db.client import db
from app.services.agent import access, budget, conversation, proposals
from app.services.agent.llm import get_llm
from app.services.agent.loop import run_turn
from app.services.agent.suggestions import suggestions_for
from app.services.agent.types import Principal

router = APIRouter(prefix="/agent", tags=["Assistant"])


async def current_principal(user: User = Depends(get_current_user)) -> Principal:
    return await access.build_principal(user)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: Optional[str] = None


class ConfirmRequest(BaseModel):
    edits: dict[str, Any] = Field(default_factory=dict)


def _line(event: dict[str, Any]) -> str:
    return json.dumps(jsonable_encoder(event)) + "\n"


@router.get("/status")
async def assistant_status(principal: Principal = Depends(current_principal)) -> dict[str, Any]:
    return await access.assistant_status(principal)


@router.post("/notice/accept")
async def accept_notice(principal: Principal = Depends(current_principal)) -> dict[str, Any]:
    return await access.accept_notice(principal)


@router.get("/suggestions")
async def suggestions(principal: Principal = Depends(current_principal)) -> dict[str, list[str]]:
    return {"suggestions": suggestions_for(principal.role)}


@router.post("/chat")
async def chat(body: ChatRequest, principal: Principal = Depends(current_principal)) -> StreamingResponse:
    await access.require_ready(principal)
    await budget.limit_messages(principal)
    await budget.require_budget(principal)
    opened = await conversation.open_conversation(principal, body.conversation_id, body.message)
    tenant = await db.tenant.find_unique(where={"id": principal.tenant_id})

    async def stream() -> AsyncIterator[str]:
        yield _line({"type": "conversation", "id": opened.id})
        async for event in run_turn(principal, tenant.name, opened.id, body.message, get_llm()):
            yield _line(event)

    return StreamingResponse(
        stream(), media_type="application/x-ndjson", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.get("/conversations")
async def list_conversations(principal: Principal = Depends(current_principal)) -> list[dict[str, Any]]:
    return await conversation.list_conversations(principal)


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, principal: Principal = Depends(current_principal)) -> list[dict[str, Any]]:
    return await conversation.messages(principal, conversation_id)


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, principal: Principal = Depends(current_principal)) -> dict[str, str]:
    await conversation.delete(principal, conversation_id)
    return {"status": "deleted"}


@router.post("/proposals/{proposal_id}/confirm")
async def confirm_proposal(
    proposal_id: str, body: ConfirmRequest, principal: Principal = Depends(current_principal)
) -> dict[str, Any]:
    return await proposals.confirm(principal, proposal_id, body.edits)


@router.post("/proposals/{proposal_id}/cancel")
async def cancel_proposal(proposal_id: str, principal: Principal = Depends(current_principal)) -> dict[str, str]:
    return await proposals.cancel(principal, proposal_id)
