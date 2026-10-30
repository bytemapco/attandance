from datetime import timedelta
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    verify_password,
    hash_password,
)


def test_password_hashing_and_verification() -> None:
    raw_password = "SecurePassword@123"
    hashed = hash_password(raw_password)
    assert hashed != raw_password
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword@123", hashed) is False


def test_access_token_creation_and_decoding() -> None:
    token = create_access_token(
        subject="user-uuid-12345",
        role="STUDENT",
        expires_delta=timedelta(minutes=15),
        extra_data={"tenant_id": "tenant-uuid-67890"},
    )
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == "user-uuid-12345"
    assert decoded["role"] == "STUDENT"
    assert decoded["tenant_id"] == "tenant-uuid-67890"


def test_refresh_token_type() -> None:
    token = create_refresh_token(subject="user-uuid-12345", role="TEACHER")
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["type"] == "refresh"


def test_invalid_token_returns_none() -> None:
    assert decode_access_token("corrupted.jwt.payload") is None
