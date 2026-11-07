"""One chat turn: the model asks for tools, the gateway runs them, until the model has an answer."""
from typing import Any, AsyncIterator

from fastapi import HTTPException

from app.core.logging_config import get_logger
from app.services.agent import budget, conversation, gateway, prompts, registry
from app.services.agent.labels import label
from app.services.agent.llm import Llm, LlmTurn
from app.services.agent.types import Principal

logger = get_logger("app.agent.loop")
MAX_STEPS = 6
STEP_BREAK = "\n\n"  # between what the model says before and after its tool calls
UNAVAILABLE = "The assistant is unavailable right now. Please try again in a moment."
BUSY = "The assistant is busy right now. Please try again in a minute."
QUOTA_EXCEEDED = 429  # the model provider's own rate limit, not ours
TOO_LONG = "I could not finish that in a few steps. Try asking for one thing at a time."


async def run_turn(
    principal: Principal, institution: str, conversation_id: str, text: str, llm: Llm
) -> AsyncIterator[dict[str, Any]]:
    """Yields events for the screen. The person's message is saved first; the answer is saved when it is complete."""
    past = await conversation.history(conversation_id)
    await conversation.add_message(principal, conversation_id, "user", text)
    history = past + [{"role": "user", "text": text, "raw": None}]
    tools = registry.tools_for(principal.role)
    system = prompts.system_prompt(principal, institution)
    shown: list[dict[str, Any]] = []
    spoken: list[str] = []

    for _ in range(MAX_STEPS):
        streamed = ""
        try:
            await budget.require_budget(principal)
            async for item in llm.stream(system, history, tools):
                if isinstance(item, LlmTurn):
                    turn = item
                    continue
                if spoken and not streamed:
                    yield {"type": "delta", "text": STEP_BREAK}
                streamed += item
                yield {"type": "delta", "text": item}
        except HTTPException as exc:
            yield {"type": "error", "message": str(exc.detail)}
            return
        except Exception as exc:
            logger.exception("The model call failed")
            yield {"type": "error", "message": BUSY if getattr(exc, "code", None) == QUOTA_EXCEEDED else UNAVAILABLE}
            return
        await budget.record_tokens(principal, turn.tokens)
        step_text = streamed or ("" if turn.calls else turn.text)
        if step_text:
            spoken.append(step_text)
        if not turn.calls:
            answer = STEP_BREAK.join(spoken)
            await conversation.add_message(principal, conversation_id, "assistant", answer, shown)
            yield {"type": "text", "text": answer}
            return
        history.append({"role": "model", "text": turn.text, "raw": turn.raw})
        results = []
        for call in turn.calls:
            yield {"type": "tool", "name": call.name, "label": label(call.name)}
            outcome = await gateway.call_tool(principal, registry.get(call.name), call.name, call.args, conversation_id)
            blocks = [{"type": "ui", **block} for block in outcome.ui]
            if outcome.card:
                blocks.append(outcome.card)
            for block in blocks:
                shown.append(block)
                yield block
            results.append({"name": call.name, "response": outcome.response})
        history.append({"role": "tool", "results": results})

    await conversation.add_message(principal, conversation_id, "assistant", TOO_LONG, shown)
    yield {"type": "text", "text": TOO_LONG}
