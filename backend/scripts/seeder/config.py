"""Seeder Configuration and Environment Resolver."""

import os
import sys
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


@dataclass(frozen=True)
class SeederConfig:
    env_name: str
    api_base_url: str
    superadmin_email: str
    superadmin_password: str
    is_prod: bool
    request_timeout: float = 30.0


def resolve_seeder_config(is_prod: bool, confirm_prod: bool) -> SeederConfig:
    """Resolve and validate environment settings safely."""
    if is_prod:
        if not confirm_prod:
            sys.exit(
                "[SECURITY ERROR] Seeding against PRODUCTION requires explicit confirmation.\n"
                "Supply the '--confirm-prod' flag to proceed safely."
            )
        prod_env = BACKEND_DIR / ".env.prod"
        if prod_env.exists():
            load_dotenv(prod_env, override=True)
        else:
            load_dotenv(BACKEND_DIR / ".env", override=True)

        env_name = "production"
        default_url = "https://attendance-backend.bytemap.in/api/v1"
        api_base = os.getenv("API_BASE_URL", default_url).rstrip("/")
        if not api_base.endswith("/api/v1"):
            api_base = f"{api_base}/api/v1"
    else:
        local_env = BACKEND_DIR / ".env"
        if local_env.exists():
            load_dotenv(local_env, override=True)

        env_name = "local"
        default_url = "http://localhost:8000/api/v1"
        api_base = os.getenv("API_BASE_URL", default_url).rstrip("/")
        if not api_base.endswith("/api/v1"):
            api_base = f"{api_base}/api/v1"

    default_email = "superadmin@yopmail.com" if is_prod else "superadmin@attendance.system"
    default_pass = "SuperAdmin@123" if is_prod else "SuperAdmin@123456"
    super_email = os.getenv("SUPERADMIN_EMAIL", default_email).strip()
    super_pass = os.getenv("SUPERADMIN_PASSWORD", default_pass).strip()

    if not super_pass:
        sys.exit(
            f"[CONFIG ERROR] SUPERADMIN_PASSWORD is required for environment '{env_name}'."
        )

    return SeederConfig(
        env_name=env_name,
        api_base_url=api_base,
        superadmin_email=super_email,
        superadmin_password=super_pass,
        is_prod=is_prod,
    )
