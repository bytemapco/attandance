"""The model behind the assistant. The loop talks to `Llm`; only `GeminiLlm` knows about Gemini."""
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any, AsyncIterator, Optional, Protocol, Union

from app.core.config import settings
from app.services.agent.key_pool import KeyPool, parse_keys
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
    def stream(self, system: str, history: list[dict[str, Any]], tools: list[Tool]) -> AsyncIterator[Union[str, LlmTurn]]:
        """Yields the answer's text as it is written, then one `LlmTurn` that ends the answer."""
        ...


def _schema(tool: Tool) -> dict[str, Any]:
    schema = tool.params.model_json_schema()
    schema.pop("title", None)
    return schema


class GeminiLlm:
    """History items: {"role": "user", "text"}, {"role": "model", "text", "raw"}, {"role": "tool", "results"}."""

    def __init__(self, api_keys: str, model: str) -> None:
        from google import genai
        from google.genai import types

        # Function calling is only available on the v1beta API. A slow or rate-limited call fails at once, so a
        # person is told straight away instead of waiting on the SDK's retries.
        options = types.HttpOptions(
            api_version="v1beta",
            timeout=REQUEST_TIMEOUT_MS,
            retry_options=types.HttpRetryOptions(attempts=1),
        )
        self._clients = {key: genai.Client(api_key=key, http_options=options) for key in parse_keys(api_keys)}
        self._pool = KeyPool(list(self._clients))
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

    @staticmethod
    def _config(system: str, tools: list[Tool]) -> Any:
        from google.genai import types

        declarations = [
            types.FunctionDeclaration(name=t.name, description=t.description, parameters_json_schema=_schema(t))
            for t in tools
        ]
        return types.GenerateContentConfig(
            system_instruction=system,
            tools=[types.Tool(function_declarations=declarations)],
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            temperature=0.2,
            # The model's own thinking delayed the first word by about 30 s. The tools do the reasoning-heavy work.
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )

    async def _open(self, key: str, contents: list[Any], config: Any) -> AsyncIterator[Any]:
        """Starts the stream and waits for its first chunk, so a key at its limit fails here and the pool moves on."""
        chunks = await self._clients[key].aio.models.generate_content_stream(model=self._model, contents=contents, config=config)
        first = await anext(chunks, None)

        async def replay() -> AsyncIterator[Any]:
            if first is not None:
                yield first
            async for chunk in chunks:
                yield chunk

        return replay()

    async def stream(self, system: str, history: list[dict[str, Any]], tools: list[Tool]) -> AsyncIterator[Union[str, LlmTurn]]:
        from google.genai import types

        config, contents = self._config(system, tools), self._contents(history)
        chunks = await self._pool.run(lambda key: self._open(key, contents, config))
        parts: list[Any] = []
        texts: list[str] = []
        calls: list[ToolCall] = []
        tokens = 0
        async for chunk in chunks:
            tokens = int(getattr(chunk.usage_metadata, "total_token_count", 0) or 0) or tokens
            content = chunk.candidates[0].content if chunk.candidates else None
            for part in (content.parts or []) if content else []:
                parts.append(part)
                if part.function_call:
                    calls.append(ToolCall(part.function_call.name, dict(part.function_call.args or {})))
                elif part.text and not part.thought:
                    texts.append(part.text)
                    yield part.text
        yield LlmTurn(text="".join(texts), calls=calls, tokens=tokens, raw=types.Content(role="model", parts=parts))


_override: Optional[Llm] = None


def set_llm(llm: Optional[Llm]) -> None:
    """Tests put a fake model here."""
    global _override
    _override = llm


@lru_cache(maxsize=4)
def _gemini(api_keys: str, model: str) -> GeminiLlm:
    """One client per key set, kept for the process, so the key pool remembers which keys are resting."""
    return GeminiLlm(api_keys, model)


def get_llm() -> Llm:
    return _override or _gemini(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)
