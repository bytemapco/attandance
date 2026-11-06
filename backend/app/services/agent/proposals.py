"""A write is prepared first, shown to the person, and runs only when that same person confirms it."""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder
from prisma import Json
from pydantic import ValidationError

from app.db.client import db
from app.services.agent import audit, registry
from app.services.agent.access import refuse
from app.services.agent.types import Preview, Principal, Tool

PROPOSAL_LIFETIME = timedelta(minutes=30)
PENDING, CONFIRMED, CANCELLED, FAILED, EXPIRED = "PENDING", "CONFIRMED", "CANCELLED", "FAILED", "EXPIRED"


def card(proposal, tool: Tool) -> dict[str, Any]:
    """What the chat shows: the plan, plus the fields the person may still change."""
    arguments = proposal.arguments if isinstance(proposal.arguments, dict) else {}
    return {
        "type": "proposal",
        "id": proposal.id,
        "tool": tool.name,
        "summary": proposal.summary,
        "details": proposal.preview,
        "editable": {name: arguments.get(name) for name in sorted(tool.editable)},
        "expires_at": proposal.expiresAt.isoformat(),
    }


async def create(
    principal: Principal, tool: Tool, arguments: dict[str, Any], preview: Preview, conversation_id: Optional[str]
):
    return await db.agentproposal.create(
        data={
            "tenantId": principal.tenant_id,
            "userId": principal.user_id,
            "conversationId": conversation_id,
            "toolName": tool.name,
            "arguments": Json(jsonable_encoder(arguments)),
            "summary": preview.summary,
            "preview": Json(jsonable_encoder(preview.details)),
            "expiresAt": datetime.now(timezone.utc) + PROPOSAL_LIFETIME,
        }
    )


async def _mine(principal: Principal, proposal_id: str):
    proposal = await db.agentproposal.find_first(
        where={"id": proposal_id, "tenantId": principal.tenant_id, "userId": principal.user_id}
    )
    if not proposal:
        raise refuse(status.HTTP_404_NOT_FOUND, "Proposal not found.")
    return proposal


async def _pending(principal: Principal, proposal_id: str):
    proposal = await _mine(principal, proposal_id)
    if proposal.status != PENDING:
        raise refuse(status.HTTP_409_CONFLICT, f"This proposal was already {proposal.status.lower()}.")
    if proposal.expiresAt <= datetime.now(timezone.utc):
        await db.agentproposal.update_many(
            where={"id": proposal.id, "status": PENDING}, data={"status": EXPIRED, "decidedAt": datetime.now(timezone.utc)}
        )
        raise refuse(status.HTTP_410_GONE, "This proposal expired. Ask the assistant again.")
    return proposal


def _arguments(tool: Tool, proposal, edits: dict[str, Any]):
    merged = dict(proposal.arguments)
    merged.update({name: value for name, value in edits.items() if name in tool.editable})
    try:
        return tool.params(**merged)
    except ValidationError as exc:
        raise refuse(status.HTTP_422_UNPROCESSABLE_CONTENT, exc.errors()[0]["msg"]) from exc


async def _claim(proposal_id: str) -> None:
    """Only one confirmation can win, so a double click never runs the change twice."""
    claimed = await db.agentproposal.update_many(
        where={"id": proposal_id, "status": PENDING}, data={"status": CONFIRMED, "decidedAt": datetime.now(timezone.utc)}
    )
    if claimed != 1:
        raise refuse(status.HTTP_409_CONFLICT, "This proposal was already decided.")


async def confirm(principal: Principal, proposal_id: str, edits: dict[str, Any]) -> dict[str, Any]:
    proposal = await _pending(principal, proposal_id)
    tool = registry.get(proposal.toolName)
    if tool is None or principal.role not in tool.roles:
        raise refuse(status.HTTP_403_FORBIDDEN, "Your role cannot do this.")
    arguments = _arguments(tool, proposal, edits)
    await tool.preview(principal, arguments)  # the world may have changed since it was proposed
    await _claim(proposal.id)
    try:
        result = await tool.run(principal, arguments)
    except HTTPException as exc:
        await _fail(principal, tool, proposal, str(exc.detail))
        raise
    except Exception as exc:
        await _fail(principal, tool, proposal, "Unexpected error")
        raise refuse(status.HTTP_500_INTERNAL_SERVER_ERROR, "The change could not be applied.") from exc
    await db.agentproposal.update(where={"id": proposal.id}, data={"result": Json(jsonable_encoder(result.data))})
    await audit.log_tool_call(
        principal, tool.name, jsonable_encoder(arguments.model_dump()), "confirmed", conversation_id=proposal.conversationId
    )
    return {"status": "confirmed", "message": result.data.get("message", "Done."), "result": result.data, "ui": result.ui}


async def _fail(principal: Principal, tool: Tool, proposal, reason: str) -> None:
    await db.agentproposal.update(where={"id": proposal.id}, data={"status": FAILED, "result": Json({"error": reason})})
    await audit.log_tool_call(
        principal, tool.name, dict(proposal.arguments), "failed", reason, conversation_id=proposal.conversationId
    )


async def cancel(principal: Principal, proposal_id: str) -> dict[str, str]:
    await _pending(principal, proposal_id)
    await db.agentproposal.update_many(
        where={"id": proposal_id, "status": PENDING}, data={"status": CANCELLED, "decidedAt": datetime.now(timezone.utc)}
    )
    return {"status": "cancelled"}
