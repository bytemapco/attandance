import argparse
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

ENV_URLS = {
    "local": "http://localhost:8000/api/v1",
    "prod": "https://attendance-backend.bytemap.in/api/v1",
    "staging": "https://attendance-staging.bytemap.in/api/v1",
}

ScaleMode = Literal["minimal", "standard", "large"]


@dataclass
class ScaleProfile:
    tenants: int
    departments_per_tenant: int
    subjects_per_tenant: int
    classrooms_per_tenant: int
    teachers_per_tenant: int
    students_per_tenant: int
    classes_per_tenant: int
    sessions_per_class: int
    leave_requests_count: int
    device_change_requests_count: int


SCALE_PROFILES: dict[ScaleMode, ScaleProfile] = {
    "minimal": ScaleProfile(
        tenants=1,
        departments_per_tenant=2,
        subjects_per_tenant=4,
        classrooms_per_tenant=2,
        teachers_per_tenant=4,
        students_per_tenant=15,
        classes_per_tenant=2,
        sessions_per_class=2,
        leave_requests_count=2,
        device_change_requests_count=2,
    ),
    "standard": ScaleProfile(
        tenants=2,
        departments_per_tenant=4,
        subjects_per_tenant=8,
        classrooms_per_tenant=4,
        teachers_per_tenant=8,
        students_per_tenant=40,
        classes_per_tenant=4,
        sessions_per_class=3,
        leave_requests_count=6,
        device_change_requests_count=4,
    ),
    "large": ScaleProfile(
        tenants=3,
        departments_per_tenant=6,
        subjects_per_tenant=15,
        classrooms_per_tenant=8,
        teachers_per_tenant=20,
        students_per_tenant=120,
        classes_per_tenant=8,
        sessions_per_class=5,
        leave_requests_count=15,
        device_change_requests_count=10,
    ),
}


@dataclass
class SeedConfig:
    env: str
    base_url: str
    superadmin_email: str
    superadmin_password: str
    scale: ScaleMode
    profile: ScaleProfile
    concurrency: int
    output_credentials_path: Path
    confirm_prod: bool
    skip_biometric: bool


def parse_args() -> SeedConfig:
    parser = argparse.ArgumentParser(
        description="Smart Attendance System — Production & Local API Data Seeder",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--env",
        choices=["local", "prod", "staging"],
        default="local",
        help="Target runtime environment.",
    )
    parser.add_argument(
        "--base-url",
        type=str,
        default=None,
        help="Explicit base API URL. Overrides --env default if specified.",
    )
    parser.add_argument(
        "--superadmin-email",
        type=str,
        default=os.getenv("SUPERADMIN_EMAIL", "superadmin@yopmail.com"),
        help="Super Admin email address for platform authentication.",
    )
    parser.add_argument(
        "--superadmin-password",
        type=str,
        default=os.getenv("SUPERADMIN_PASSWORD", "SuperAdmin@123456"),
        help="Super Admin password.",
    )
    parser.add_argument(
        "--scale",
        choices=["minimal", "standard", "large"],
        default="standard",
        help="Seeding volume scale profile.",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=5,
        help="Concurrent requests limit for batch operations.",
    )
    parser.add_argument(
        "--output-credentials",
        type=str,
        default="seed_credentials.json",
        help="Output JSON file for generated credentials and tokens.",
    )
    parser.add_argument(
        "--confirm-prod",
        action="store_true",
        help="Explicit confirmation acknowledging production seeding.",
    )
    parser.add_argument(
        "--skip-biometric",
        action="store_true",
        help="Skip heavy neural face embedding extraction if running on constrained CPU.",
    )

    args = parser.parse_args()

    target_env = args.env
    resolved_url = args.base_url or ENV_URLS.get(target_env, ENV_URLS["local"])
    resolved_url = resolved_url.rstrip("/")

    if target_env == "prod" and not args.confirm_prod:
        if sys.stdin.isatty():
            prompt = input("⚠️  Targeting PRODUCTION environment! Type 'PROD-SEED' to proceed: ").strip()
            if prompt != "PROD-SEED":
                sys.exit("[SECURITY] Aborted: Production seeding not confirmed.")
        else:
            sys.exit("[SECURITY] Aborted: Automated execution on prod requires --confirm-prod flag.")

    scale_mode: ScaleMode = args.scale
    profile = SCALE_PROFILES[scale_mode]

    pwd = args.superadmin_password
    if pwd == "SuperAdmin@123456" and target_env == "prod":
        pwd = "SuperAdmin@123"

    out_file = args.output_credentials
    if out_file == "seed_credentials.json" and target_env == "prod":
        out_file = "seed_credentials.prod.json"

    return SeedConfig(
        env=target_env,
        base_url=resolved_url,
        superadmin_email=args.superadmin_email,
        superadmin_password=pwd,
        scale=scale_mode,
        profile=profile,
        concurrency=max(1, args.concurrency),
        output_credentials_path=Path(out_file).resolve(),
        confirm_prod=args.confirm_prod,
        skip_biometric=args.skip_biometric,
    )
