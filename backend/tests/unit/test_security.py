from datetime import timedelta

import jwt
import pytest

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_session_token,
    generate_temporary_password,
    hash_password,
    verify_password,
)


class TestPasswords:
    def test_a_hash_verifies_only_against_its_own_password(self):
        hashed = hash_password("Correct-Horse-9")
        assert verify_password("Correct-Horse-9", hashed) is True
        assert verify_password("correct-horse-9", hashed) is False

    def test_the_same_password_gets_a_different_hash_each_time(self):
        assert hash_password("same") != hash_password("same")

    @pytest.mark.parametrize("plain, hashed", [(None, "x"), ("x", None), (1, 2), ("x", "not-a-bcrypt-hash")])
    def test_bad_input_is_a_failed_check_not_an_exception(self, plain, hashed):
        assert verify_password(plain, hashed) is False


class TestTokens:
    def test_an_access_token_round_trips_its_claims(self):
        token = create_access_token("user-1", "TEACHER", extra_data={"tid": "tenant-1"})
        payload = decode_access_token(token)
        assert payload["sub"] == "user-1" and payload["role"] == "TEACHER" and payload["tid"] == "tenant-1"

    def test_an_expired_token_is_refused(self):
        token = create_access_token("user-1", "TEACHER", expires_delta=timedelta(seconds=-5))
        assert decode_access_token(token) is None

    def test_a_token_signed_with_another_secret_is_refused(self):
        forged = jwt.encode({"sub": "user-1", "role": "SUPER_ADMIN"}, "another-secret-another-secret-123456", algorithm="HS256")
        assert decode_access_token(forged) is None

    def test_a_tampered_payload_is_refused(self):
        header, _, signature = create_access_token("user-1", "STUDENT").split(".")
        forged_payload = jwt.utils.base64url_encode(b'{"sub":"user-1","role":"SUPER_ADMIN","exp":9999999999}').decode()
        assert decode_access_token(f"{header}.{forged_payload}.{signature}") is None

    def test_the_none_algorithm_is_refused(self):
        unsigned = jwt.encode({"sub": "user-1", "role": "SUPER_ADMIN"}, key=None, algorithm="none")
        assert decode_access_token(unsigned) is None

    def test_garbage_is_refused(self):
        assert decode_access_token("not.a.token") is None

    def test_a_refresh_token_carries_its_type_and_is_not_a_session_token(self):
        refresh = create_refresh_token("user-1", "STUDENT")
        assert decode_access_token(refresh)["type"] == "refresh"
        assert decode_session_token(refresh) is None

    def test_a_login_token_is_a_session_token(self):
        assert decode_session_token(create_access_token("user-1", "ADMIN"))["sub"] == "user-1"

    def test_tokens_use_the_configured_algorithm(self):
        header = jwt.get_unverified_header(create_access_token("user-1", "ADMIN"))
        assert header["alg"] == settings.JWT_ALGORITHM


class TestTemporaryPassword:
    def test_it_has_the_requested_length_and_mixed_character_classes(self):
        for _ in range(50):
            password = generate_temporary_password(10)
            assert len(password) == 10
            assert any(c.isupper() for c in password)
            assert any(c.islower() for c in password)
            assert sum(c.isdigit() for c in password) >= 2

    def test_it_never_uses_look_alike_characters(self):
        joined = "".join(generate_temporary_password(12) for _ in range(100))
        assert not set("0O1lI") & set(joined)

    def test_a_short_length_still_has_all_required_classes(self):
        assert len(generate_temporary_password(2)) == 4

    def test_two_passwords_differ(self):
        assert generate_temporary_password() != generate_temporary_password()
