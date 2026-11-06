"""The model behind the assistant. The loop talks to `Llm`; only `GeminiLlm` knows about Gemini."""
from dataclasses import dataclass, field
from typing import Any, Optional, Protocol

from app.core.config import settings
from app.services.agent.types import Tool


REQUEST_TIMEOUT_MS = 40_000


@dataclass
class ToolCall:
    name: str
    args: dict[str, Any]


@dataclass
class LlmTurn:
    """One model answer: text, tool calls, or both. `raw` is what the provider needs to see again next step."""

    text: str = ""
    calls: list[ToolCall] = field(default_factory=list)
    tokens: int = 0
    raw: Any = None


class Llm(Protocol):
    async def generate(self, system: str, history: list[dict[str, Any]], tools: list[Tool]) -> LlmTurn: ...


def _schema(tool: Tool) -> dict[str, Any]:
    schema = tool.params.model_json_schema()
    schema.pop("title", None)
    return schema


class GeminiLlm:
    """History items: {"role": "user", "text"}, {"role": "model", "text", "raw"}, {"role": "tool", "results"}."""

    def __init__(self, api_key: str, model: str) -> None:
        from google import genai
        from google.genai import types

        # Function calling is only available on the v1beta API. A slow or rate-limited call fails at once, so a
        # person is told straight away instead of waiting on the SDK's retries.
        options = types.HttpOptions(
            api_version="v1beta",
            timeout=REQUEST_TIMEOUT_MS,
            retry_options=types.HttpRetryOptions(attempts=1),
        )
        self._client = genai.Client(api_key=api_key, http_options=options)
        self._model = model

    @staticmethod
    def _contents(history: list[dict[str, Any]]) -> list[Any]:
        from google.genai import types

        contents = []
        for item in history:
            if item["role"] == "user":
                contents.append(types.Content(role="user", parts=[types.Part.from_text(text=item["text"])]))
            elif item["role"] == "model":
                contents.append(item["raw"] or types.Content(role="model", parts=[types.Part.from_text(text=item["text"])]))
            else:
                parts = [types.Part.from_function_response(name=r["name"], response=r["response"]) for r in item["results"]]
                contents.append(types.Content(role="user", parts=parts))
        return contents

    async def generate(self, system: str, history: list[dict[str, Any]], tools: list[Tool]) -> LlmTurn:
        from google.genai import types

        declarations = [
            types.FunctionDeclaration(name=t.name, description=t.description, parameters_json_schema=_schema(t))
            for t in tools
        ]
        config = types.GenerateContentConfig(
            system_instruction=system,
            tools=[types.Tool(function_declarations=declarations)],
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            temperature=0.2,
        )
        response = await self._client.aio.models.generate_content(
            model=self._model, contents=self._contents(history), config=config
        )
        calls = [ToolCall(call.name, dict(call.args or {})) for call in (response.function_calls or [])]
        usage = response.usage_metadata
        content = response.candidates[0].content if response.candidates else None
        return LlmTurn(
            text=(response.text or "") if not calls else "",
            calls=calls,
            tokens=int(getattr(usage, "total_token_count", 0) or 0),
            raw=content,
        )


_override: Optional[Llm] = None


def set_llm(llm: Optional[Llm]) -> None:
    """Tests put a fake model here."""
    global _override
    _override = llm


def get_llm() -> Llm:
    return _override or GeminiLlm(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)
