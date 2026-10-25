from datetime import timedelta
import pytest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    generate_temporary_password,
)


@pytest.mark.unit
def test_password_hashing_and_verification():
    raw_password = "SecurePassword123!"
    hashed = hash_password(raw_password)

    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False


@pytest.mark.unit
def test_verify_password_invalid_types():
    assert verify_password("password", None) is False
    assert verify_password("password", "invalid_hash_string") is False


@pytest.mark.unit
def test_temporary_password_generation():
    password_default = generate_temporary_password()
    assert len(password_default) >= 8

    password_custom = generate_temporary_password(16)
    assert len(password_custom) == 16
    assert any(c.isupper() for c in password_custom)
    assert any(c.islower() for c in password_custom)
    assert any(c.isdigit() for c in password_custom)


@pytest.mark.unit
def test_access_token_creation_and_decoding():
    user_id = "user-12345"
    role = "STUDENT"
    extra = {"tid": "tenant-abc"}

    token = create_access_token(subject=user_id, role=role, extra_data=extra)
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["role"] == role
    assert payload["tid"] == "tenant-abc"
    assert "exp" in payload


@pytest.mark.unit
def test_access_token_expired():
    token = create_access_token(
        subject="user-expired",
        role="TEACHER",
        expires_delta=timedelta(seconds=-10),
    )
    payload = decode_access_token(token)
    assert payload is None


@pytest.mark.unit
def test_access_token_tampered():
    token = create_access_token(subject="user-123", role="ADMIN")
    tampered = token[:-4] + "fake"
    payload = decode_access_token(tampered)
    assert payload is None
