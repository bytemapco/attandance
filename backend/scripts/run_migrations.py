#!/usr/bin/env python3
"""Explicit One-Shot Database Migration Runner for Smart Attendance System (Staging / Dev Only).

Executes pending Prisma migrations safely via `prisma migrate deploy`.
Never runs automatically during normal web application startup.
STRICTLY BLOCKS production execution and cannot perform destructive database resets.

Usage:
    python backend/scripts/run_migrations.py
    python backend/scripts/run_migrations.py --with-tenant-backfill
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

try:
    from dotenv import load_dotenv

    load_dotenv(backend_root / ".env")
    if not os.getenv("DATABASE_URL"):
        load_dotenv(backend_root.parent / ".env")
except ImportError:
    pass

# Block production targets completely from this staging migration runner
FORBIDDEN_ENVIRONMENTS = {"production", "prod", "live"}
ALLOWED_ENVIRONMENTS = {"development", "local", "staging", "test"}


def verify_migration_history() -> Path:
    """Verify that Prisma migration directory exists and contains migration files."""
    migrations_dir = backend_root / "prisma" / "migrations"
    if not migrations_dir.is_dir():
        sys.exit(f"[MIGRATION ERROR] Prisma migrations directory not found at: {migrations_dir}")

    migration_items = [d for d in migrations_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]
    if not migration_items:
        sys.exit("[MIGRATION ERROR] No migration history found in prisma/migrations directory.")

    return migrations_dir


def validate_environment() -> tuple[str, str]:
    """Validate database target and enforce production lockout."""
    env_name = (os.getenv("ENVIRONMENT") or os.getenv("ENV") or "").strip().lower()

    # Fail closed if environment is unconfigured or marked as production
    if not env_name:
        sys.exit(
            "[MIGRATION ERROR] ENVIRONMENT or ENV variable is not configured. "
            "Must be explicitly set to 'staging' or 'development'."
        )

    if env_name in FORBIDDEN_ENVIRONMENTS:
        sys.exit(
            f"[MIGRATION ERROR] Direct migration execution against '{env_name}' is strictly forbidden by this tool."
        )

    if env_name not in ALLOWED_ENVIRONMENTS:
        sys.exit(
            f"[MIGRATION ERROR] Unrecognized environment '{env_name}'. Allowed: {', '.join(sorted(ALLOWED_ENVIRONMENTS))}."
        )

    db_url = os.getenv("DATABASE_URL", "").strip()
    if not db_url:
        sys.exit(
            "[MIGRATION ERROR] DATABASE_URL is not set. Cannot run migrations without an explicit database target."
        )

    try:
        parsed = urlparse(db_url)
    except Exception as exc:
        sys.exit(f"[MIGRATION ERROR] Failed to parse DATABASE_URL: {exc}")

    hostname = (parsed.hostname or "unknown").strip().lower()
    raw_path = parsed.path.lstrip("/")
    dbname = raw_path.split("?")[0].strip() if raw_path else "unknown"

    # Heuristic host check to prevent accidental production connection
    if any(prod_term in hostname for prod_term in ("prod", "production", "live")):
        sys.exit(
            f"[MIGRATION ERROR] Target hostname '{hostname}' contains production indicator. Aborting."
        )

    return f"{hostname}:{parsed.port or 5432}/{dbname}", env_name


def run_prisma_migrations() -> None:
    """Execute `prisma migrate deploy` safely as a subprocess.

    Note: `prisma migrate deploy` ONLY applies unapplied versioned migrations.
    It does not drop tables, push arbitrary schema changes, or perform resets.
    """
    migrations_dir = verify_migration_history()
    sanitized_target, env_name = validate_environment()

    print("==================================================================")
    print("🚀 SMART ATTENDANCE SYSTEM - CONTROLLED DATABASE MIGRATION")
    print(f"  Target Environment: {env_name}")
    print(f"  Target Endpoint:    {sanitized_target}")
    print(f"  Migration Source:   {migrations_dir}")
    print("==================================================================")
    print("\n[1/2] Applying pending Prisma schema migrations (`prisma migrate deploy`)...")

    python_bin = sys.executable
    cmd = [
        python_bin,
        "-m",
        "prisma",
        "migrate",
        "deploy",
        "--schema",
        str(backend_root / "prisma" / "schema.prisma"),
    ]

    result = subprocess.run(cmd, cwd=str(backend_root), capture_output=False)
    if result.returncode != 0:
        sys.exit(f"\n[MIGRATION FAILED] Prisma migration exited with code {result.returncode}.")

    print("✓ Prisma migrations applied successfully (no destructive reset allowed).")


def run_tenant_backfill() -> None:
    """Execute optional tenant backfill script."""
    print("\n[2/2] Running multi-tenant data backfill (`migrate_multitenant.py`)...")
    python_bin = sys.executable
    cmd = [python_bin, str(backend_root / "scripts" / "migrate_multitenant.py")]

    result = subprocess.run(cmd, cwd=str(backend_root), capture_output=False)
    if result.returncode != 0:
        sys.exit(f"\n[BACKFILL FAILED] Multi-tenant backfill exited with code {result.returncode}.")

    print("✓ Multi-tenant backfill completed successfully.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Controlled One-Shot Database Migration Runner (Staging / Dev Only)",
    )
    parser.add_argument(
        "--with-tenant-backfill",
        action="store_true",
        help="Run the multitenant tenant backfill migration following schema migrations.",
    )

    args = parser.parse_args()

    run_prisma_migrations()

    if args.with_tenant_backfill:
        run_tenant_backfill()
    else:
        print("\nNote: Multi-tenant backfill was skipped (use --with-tenant-backfill to include).")

    print("\n🎉 Controlled database migration finished cleanly.\n")


if __name__ == "__main__":
    main()
