#!/usr/bin/env python3
"""Creates the platform's SUPER_ADMIN account if it does not exist. It never changes or deletes anything else.

There is no API for this: a super admin is the first account, so it has to be made in the database.
Reads SUPERADMIN_EMAIL (default superadmin.vit@yopmail.com) and SUPERADMIN_PASSWORD (required, no default)
from the environment or backend/.env.

Usage: SUPERADMIN_PASSWORD=... python scripts/create_super_admin.py
"""
import asyncio
import os
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(backend_root / ".env")

from app.core.security import hash_password  # noqa: E402
from app.db.client import connect_db, db, disconnect_db  # noqa: E402

DEFAULT_EMAIL = "superadmin.vit@yopmail.com"


async def create_if_missing(email: str, password: str) -> str:
    existing = await db.user.find_first(where={"email": email})
    if existing:
        return f"{email} already exists (role {existing.role}); nothing changed."
    await db.user.create(
        data={"email": email, "hashedPassword": hash_password(password), "role": "SUPER_ADMIN", "isActive": True}
    )
    return f"Created super admin {email}."


async def main() -> int:
    password = os.getenv("SUPERADMIN_PASSWORD")
    if not password:
        sys.stderr.write("Set SUPERADMIN_PASSWORD; there is no default.\n")
        return 2
    await connect_db()
    try:
        sys.stdout.write(await create_if_missing(os.getenv("SUPERADMIN_EMAIL", DEFAULT_EMAIL), password) + "\n")
    finally:
        await disconnect_db()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
