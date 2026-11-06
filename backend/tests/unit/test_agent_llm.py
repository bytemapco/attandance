from google.genai import types

from app.services.agent import registry
from app.services.agent.llm import GeminiLlm, _schema


def test_every_tool_schema_is_accepted_by_the_gemini_sdk():
    for tool in registry.TOOLS.values():
        declaration = types.FunctionDeclaration(
            name=tool.name, description=tool.description, parameters_json_schema=_schema(tool)
        )
        assert declaration.name == tool.name


def test_a_schema_carries_the_argument_descriptions_the_model_relies_on():
    schema = _schema(registry.TOOLS["students_below_minimum"])
    assert "title" not in schema
    assert "find_classes" in schema["properties"]["class_id"]["description"]


def test_history_becomes_user_model_and_tool_turns_in_order():
    history = [
        {"role": "user", "text": "hi", "raw": None},
        {"role": "model", "text": "hello", "raw": None},
        {"role": "user", "text": "schedule?", "raw": None},
        {"role": "tool", "results": [{"name": "my_schedule", "response": {"classes": []}}]},
    ]

    contents = GeminiLlm._contents(history)

    assert [c.role for c in contents] == ["user", "model", "user", "user"]
    assert contents[3].parts[0].function_response.name == "my_schedule"


def test_a_model_turn_with_provider_data_is_sent_back_unchanged():
    raw = types.Content(role="model", parts=[types.Part.from_function_call(name="my_schedule", args={})])

    [content] = GeminiLlm._contents([{"role": "model", "text": "", "raw": raw}])

    assert content is raw


def test_the_client_uses_the_api_version_that_allows_function_calling():
    llm = GeminiLlm("test-key", "any-model")

    assert llm._client._api_client._http_options.api_version == "v1beta"
