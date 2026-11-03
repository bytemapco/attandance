#!/usr/bin/env python3
"""Wipes the local development database and seeds a complete IIT Bombay demo institution.

Uses the same fail-closed safety checks as reset_database.py: local database and development
environment only. Every demo account has the same password (see seed_iitb/data.py).

    python scripts/seed_iit_bombay.py --force-destructive-wipe --confirm-target-db=<database name>
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

import reset_database  # noqa: E402  (shares the destructive-operation safety checks)
from seed_iitb import data  # noqa: E402


async def seed() -> None:
    from app.core.security import hash_password
    from app.db.client import connect_db, db, disconnect_db
    from seed_iitb.classes import create_classes
    from seed_iitb.history import build_history
    from seed_iitb.institution import create_institution

    os.environ.setdefault("SUPERADMIN_EMAIL", data.SUPER_EMAIL)
    host, name = reset_database.parse_and_validate_database_target()
    await reset_database.run_wipe_and_init(host, name)

    await connect_db()
    try:
        hashed = hash_password(data.PASSWORD)
        refs = await create_institution(hashed)
        classes = await create_classes(refs, hashed)
        await build_history(refs, classes)
        counts = {
            "teachers": await db.teacher.count(),
            "students": await db.student.count(),
            "class occurrences": await db.classoccurrence.count(),
            "attendance records": await db.attendancerecord.count(),
        }
    finally:
        await disconnect_db()

    print("\nIIT Bombay is ready.")
    for label, value in counts.items():
        print(f"  {label}: {value}")
    print(f"\nPassword for every demo account: {data.PASSWORD}")
    print(f"  Platform admin  {os.environ['SUPERADMIN_EMAIL']}  (password: {os.getenv('SUPERADMIN_PASSWORD', 'SuperAdmin@123456')})")
    print(f"  Institute admin {data.ADMIN_EMAIL}")
    print("  Teacher         sunita.cse@yopmail.com   (login ID F1001)")
    print("  Student         aarav01@yopmail.com      (login ID 24B0501)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Wipe the local database and seed IIT Bombay.")
    parser.add_argument("--force-destructive-wipe", action="store_true")
    parser.add_argument("--confirm-target-db", default="")
    args = parser.parse_args()

    reset_database.verify_execution_environment()
    _, target_db = reset_database.parse_and_validate_database_target()
    if not args.force_destructive_wipe:
        sys.exit("[SECURITY ERROR] Supply '--force-destructive-wipe' to run this destructive script.")
    if args.confirm_target_db != target_db:
        sys.exit(f"[SECURITY ERROR] Supply '--confirm-target-db={target_db}' to confirm the database to wipe.")
    asyncio.run(seed())


if __name__ == "__main__":
    main()
