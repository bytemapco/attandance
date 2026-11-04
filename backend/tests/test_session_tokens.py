import pytest
from fastapi import HTTPException

from app.api import dependencies
from app.core.security import create_access_token, create_refresh_token, decode_session_token


def test_a_login_token_is_accepted():
    token = create_access_token(subject="user-1", role="TEACHER")
    assert decode_session_token(token)["sub"] == "user-1"


@pytest.mark.parametrize(
    "token",
    [
        create_refresh_token(subject="user-1", role="TEACHER"),
        create_access_token(subject="occ-1", role="QR", extra_data={"type": "occurrence_qr"}),
        create_access_token(subject="user-1", role="STUDENT", extra_data={"type": "smart_pass"}),
    ],
)
def test_tokens_made_for_another_purpose_are_not_login_tokens(token):
    assert decode_session_token(token) is None


async def test_a_refresh_token_cannot_authenticate_a_request(monkeypatch):
    monkeypatch.setattr(dependencies, "ensure_not_revoked", lambda token, messages: _done())
    with pytest.raises(HTTPException) as caught:
        await dependencies._validate_token_payload(create_refresh_token(subject="user-1", role="TEACHER"))
    assert caught.value.status_code == 401


async def _done() -> None:
    return None
