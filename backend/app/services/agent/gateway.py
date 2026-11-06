"""The one door every tool call passes through: role check, argument check, audit, and the confirm step for writes."""
import time
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Optional

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError

from app.core.logging_config import get_logger
from app.services.agent import audit, proposals
from app.services.agent.types import Principal, Tool

logger = get_logger("app.agent.gateway")


@dataclass
class Outcome:
    """`response` goes back to the model; `ui` and `card` are shown to the person."""

    response: dict[str, Any]
    ui: list[dict[str, Any]] = field(default_factory=list)
    card: Optional[dict[str, Any]] = None


def _failure(message: str) -> Outcome:
    return Outcome(response={"error": message})


def _elapsed_ms(started: float) -> int:
    return int((time.monotonic() - started) * 1000)


async def call_tool(
    principal: Principal, tool: Optional[Tool], name: str, raw_args: dict[str, Any], conversation_id: Optional[str]
) -> Outcome:
    started = time.monotonic()

    async def log(outcome: str, detail: Optional[str] = None) -> None:
        await audit.log_tool_call(principal, name, raw_args, outcome, detail, _elapsed_ms(started), conversation_id)

    if tool is None or principal.role not in tool.roles:
        await log("denied", "unknown tool or role not allowed")
        return _failure(f"The tool '{name}' is not available to you.")
    try:
        arguments = tool.params(**raw_args)
    except ValidationError as exc:
        await log("error", "invalid arguments")
        return _failure(f"Invalid arguments: {exc.errors()[0]['msg']} ({'.'.join(map(str, exc.errors()[0]['loc']))})")
    try:
        if tool.writes:
            return await _propose(principal, tool, arguments, conversation_id, log)
        result = await tool.run(principal, arguments)
    except HTTPException as exc:
        await log("error", str(exc.detail))
        return _failure(str(exc.detail))
    except Exception:
        logger.exception("Tool %s failed", name)
        await log("error", "unexpected error")
        return _failure("The tool failed. Tell the user it could not be done right now.")
    await log("ok")
    return Outcome(response=jsonable_encoder(result.data), ui=result.ui)


async def _propose(
    principal: Principal, tool: Tool, arguments, conversation_id: Optional[str], log: Callable[..., Awaitable[None]]
) -> Outcome:
    preview = await tool.preview(principal, arguments)
    stored = await proposals.create(principal, tool, arguments.model_dump(mode="json"), preview, conversation_id)
    await log("proposed", preview.summary)
    return Outcome(
        response={
            "status": "awaiting_confirmation",
            "summary": preview.summary,
            "note": "Nothing has been changed. The user must press Confirm on the card shown to them.",
        },
        card=proposals.card(stored, tool),
    )
