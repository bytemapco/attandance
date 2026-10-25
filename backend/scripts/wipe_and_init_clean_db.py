#!/usr/bin/env python3
"""Clean Database Reset & Initial Super Admin Provisioner (Local Development Only).

Wipes tables cleanly and initializes a clean schema with a single Super Admin account.

SAFETY NOTICE:
This script performs irreversible destructive operations (TRUNCATE TABLE CASCADE).
It is strictly locked to verified local development databases and will fail-closed
in production, staging, CI/CD, or unverified environments.
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

try:
    from dotenv import load_dotenv

    # Load local environment configuration
    load_dotenv(backend_root / ".env")
    if not os.getenv("DATABASE_URL"):
        load_dotenv(backend_root.parent / ".env")
except ImportError:
    pass

# ------------------------------------------------------------------------------
# Security Allow Lists (Strictly Local Development Only)
# ------------------------------------------------------------------------------
ALLOWED_ENVIRONMENTS = {"development", "local", "test"}
ALLOWED_HOSTS = {"localhost", "127.0.0.1", "::1", "postgres", "db"}
ALLOWED_DB_NAMES = {
    "smart_attendance",
    "smart_attendance_dev",
    "smart_attendance_test",
    "smart_attendance_local",
    "postgres",
}

DISALLOWED_HOST_SUBSTRINGS = (
    "rds.amazonaws.com",
    "amazonaws.com",
    "supabase.co",
    "neon.tech",
    "elephantsql.com",
    "aivencloud.com",
    "cockroachlabs.cloud",
)

CI_ENVIRONMENT_VARS = (
    "CI",
    "CONTINUOUS_INTEGRATION",
    "GITHUB_ACTIONS",
    "GITLAB_CI",
    "JENKINS_URL",
    "BUILD_NUMBER",
    "TRAVIS",
    "CIRCLECI",
)


def verify_execution_environment() -> str:
    """Enforce fail-closed environment validation.

    Rejects production, staging, CI, or unverified environments.
    """
    # 1. Reject CI / Automated runner environments
    for ci_var in CI_ENVIRONMENT_VARS:
        if os.getenv(ci_var):
            sys.exit(
                f"[SECURITY ERROR] Destructive database wipe is strictly forbidden in CI environments (detected {ci_var})."
            )

    # 2. Reject non-local application environments
    env_name = (os.getenv("ENVIRONMENT") or os.getenv("ENV") or "").strip().lower()
    if not env_name:
        sys.exit(
            "[SECURITY ERROR] ENVIRONMENT or ENV variable is not set. Cannot verify safe environment. Aborting."
        )

    if env_name not in ALLOWED_ENVIRONMENTS:
        sys.exit(
            f"[SECURITY ERROR] Destructive wipe rejected for environment '{env_name}'. "
            f"Execution is only permitted in: {', '.join(sorted(ALLOWED_ENVIRONMENTS))}."
        )

    return env_name


def parse_and_validate_database_target() -> tuple[str, str]:
    """Parse DATABASE_URL and validate against local development allowlists.

    Never logs or displays the full connection string or credentials.
    """
    db_url = os.getenv("DATABASE_URL", "").strip()
    if not db_url:
        sys.exit(
            "[SECURITY ERROR] DATABASE_URL is not set. Refusing to operate on an undefined database target."
        )

    try:
        parsed = urlparse(db_url)
    except Exception as exc:
        sys.exit(f"[SECURITY ERROR] Could not parse DATABASE_URL: {exc}")

    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        sys.exit(
            "[SECURITY ERROR] Could not determine database host from DATABASE_URL. Aborting."
        )

    # Check for disallowed cloud host patterns
    for cloud_pattern in DISALLOWED_HOST_SUBSTRINGS:
        if cloud_pattern in hostname:
            sys.exit(
                f"[SECURITY ERROR] Database host '{hostname}' matches disallowed cloud pattern '{cloud_pattern}'. "
                "Destructive operations against cloud databases are strictly blocked."
            )

    # Check against local allowlist
    if hostname not in ALLOWED_HOSTS:
        sys.exit(
            f"[SECURITY ERROR] Database host '{hostname}' is not in the verified local development allowlist: "
            f"{', '.join(sorted(ALLOWED_HOSTS))}."
        )

    # Extract and validate database name
    raw_path = parsed.path.lstrip("/")
    dbname = raw_path.split("?")[0].strip() if raw_path else ""
    if not dbname:
        sys.exit(
            "[SECURITY ERROR] Could not extract database name from DATABASE_URL path. Aborting."
        )

    if dbname not in ALLOWED_DB_NAMES:
        sys.exit(
            f"[SECURITY ERROR] Database name '{dbname}' is not in the verified local development allowlist: "
            f"{', '.join(sorted(ALLOWED_DB_NAMES))}."
        )

    return hostname, dbname


async def run_wipe_and_init(target_host: str, target_db: str) -> None:
    """Execute clean wipe and seed initial Super Admin on verified local target."""
    from app.core.security import hash_password
    from app.db.client import connect_db, db, disconnect_db

    print("=======================================================")
    print("🧼 EXECUTING VERIFIED LOCAL DATABASE WIPE")
    print(f"  Target Host:     {target_host}")
    print(f"  Target Database: {target_db}")
    print("=======================================================")

    await connect_db()

    try:
        print("[1/2] Fetching public tables and truncating with CASCADE...")
        res = await db.query_raw("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        """)
        tables = [r["table_name"] for r in res if not r["table_name"].startswith("_")]
        for t in tables:
            try:
                await db.execute_raw(f'TRUNCATE TABLE "{t}" CASCADE;')
                print(f"  ✓ Truncated {t}")
            except Exception as e:
                print(f"  ✗ Failed to truncate {t}: {e}")

        print("\n[2/2] Provisioning default Super Admin & System Configuration...")
        super_email = os.getenv("SUPERADMIN_EMAIL", "superadmin@attendance.system")
        super_pass = os.getenv("SUPERADMIN_PASSWORD", "SuperAdmin@123456")

        hashed_pwd = hash_password(super_pass)

        await db.user.create(
            data={
                "email": super_email,
                "hashedPassword": hashed_pwd,
                "role": "SUPER_ADMIN",
                "isActive": True,
            }
        )

        await db.systemconfiguration.create(
            data={
                "isFaceRecognitionEnabled": True,
                "isGpsVerificationEnabled": True,
                "isAiBackgroundValidationEnabled": True,
            }
        )

        print(f"🎉 Clean local DB ready! Super Admin: {super_email}")
    finally:
        await disconnect_db()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Destructive Database Wipe & Reset (Verified Local Development Only)",
    )
    parser.add_argument(
        "--force-destructive-wipe",
        action="store_true",
        help="Explicit required flag acknowledging destructive table truncation.",
    )
    parser.add_argument(
        "--confirm-target-db",
        type=str,
        default="",
        help="Second confirmation parameter: must match the target database name exactly.",
    )

    args = parser.parse_args()

    # 1. Environment & CI verification
    active_env = verify_execution_environment()

    # 2. Database target resolution & allowlist verification
    target_host, target_db = parse_and_validate_database_target()

    # 3. Explicit destructive flag requirement
    if not args.force_destructive_wipe:
        sys.exit(
            "[SECURITY ERROR] Destructive operation rejected. "
            "You must supply '--force-destructive-wipe' to execute this script."
        )

    # 4. Explicit second confirmation tied to database name
    if args.confirm_target_db != target_db:
        if sys.stdin.isatty():
            print(f"\n⚠️  WARNING: You are about to DESTROY ALL DATA in database '{target_db}' on '{target_host}'.")
            prompt_confirm = input(f"Type the exact database name '{target_db}' to proceed: ").strip()
            if prompt_confirm != target_db:
                sys.exit("[SECURITY ERROR] Confirmation mismatch. Wipe operation aborted.")
        else:
            sys.exit(
                f"[SECURITY ERROR] Automated or non-interactive execution requires '--confirm-target-db={target_db}'. "
                "Aborting."
            )

    print(f"[VERIFIED] Environment: '{active_env}' | Target: '{target_host}/{target_db}'. Proceeding...")
    asyncio.run(run_wipe_and_init(target_host, target_db))


if __name__ == "__main__":
    main()
