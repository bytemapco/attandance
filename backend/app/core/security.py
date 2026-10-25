from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not isinstance(plain_password, str) or not isinstance(hashed_password, str):
        return False
    try:
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
    except (ValueError, TypeError, AttributeError):
        return False


def create_access_token(
    subject: str,
    role: str,
    expires_delta: timedelta | None = None,
    extra_data: dict[str, Any] | None = None,
) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "exp": int(expire.timestamp()),
    }
    if extra_data:
        to_encode.update(extra_data)
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def generate_temporary_password(length: int = 8) -> str:
    import secrets

    # Unambiguous uppercase, lowercase, and digits (no confusing chars like 0, O, 1, l, I)
    upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    lower = "abcdefghijkmnpqrstuvwxyz"
    digits = "23456789"
    all_chars = upper + lower + digits

    password = [
        secrets.choice(upper),
        secrets.choice(lower),
        secrets.choice(digits),
        secrets.choice(digits),
    ]
    password += [secrets.choice(all_chars) for _ in range(max(0, length - len(password)))]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)
