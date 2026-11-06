"""Seeds a running SAHAJ API with a fictional college: set-up, people, timetable, four weeks of attendance.

Every write is a real HTTP call, so validation and business rules run as they do for the apps.
Run it with the backend's Python (it needs httpx and faker):

    backend/.venv/bin/python seed.py --base-url http://127.0.0.1:8000
"""
import argparse
import os
import secrets
import sys

import httpx

from seedlib import accounts, classes, credentials, daily_use, history, live_class, master, platform, users, workflows
from seedlib.client import Api, Tally, log
from seedlib.context import Ctx

DEFAULT_PASSWORD = secrets.token_urlsafe(12)  # new each run; shared by every account and saved in credentials.txt


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="API root without /api/v1")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="password given to every demo account")
    parser.add_argument("--super-email", default=os.getenv("SUPERADMIN_EMAIL", "superadmin.vit@yopmail.com"))
    parser.add_argument("--super-password", default=os.getenv("SUPERADMIN_PASSWORD", DEFAULT_PASSWORD))
    parser.add_argument(
        "--allow-production",
        action="store_true",
        help="seed an API that reports production or staging. Demo accounts share one password, so use it knowingly",
    )
    return parser.parse_args()


def refuse_production(base_url: str, allow_production: bool) -> None:
    try:
        health = httpx.get(f"{base_url.rstrip('/')}/health", timeout=15).json()
    except (httpx.HTTPError, ValueError) as err:
        raise SystemExit(f"Cannot reach the API at {base_url}: {err}")
    environment = str(health.get("environment", "")).lower()
    if allow_production and environment:
        return
    if environment in ("", "production", "prod", "staging"):
        raise SystemExit(f"Refusing to seed: the API reports environment '{environment or 'unknown'}'.")


def print_summary(tally: Tally) -> None:
    log("\n== Summary")
    log(f"  created: {tally.created}\n  skipped: {tally.skipped}\n  failed:  {tally.failed}")
    for failure in tally.failures:
        log(f"  ! {failure}")


def main() -> int:
    args = parse_args()
    refuse_production(args.base_url, args.allow_production)
    tally = Tally()
    api = Api(args.base_url.rstrip("/") + "/api/v1", tally)
    ctx = Ctx(api, args.password, args.super_email, args.super_password)

    platform.provision_tenant(ctx)
    master.configure(ctx)
    master.master_data(ctx)
    master.batches(ctx)
    users.teachers(ctx)
    users.students(ctx)
    classes.classes_and_sections(ctx)
    classes.weekly_timetable(ctx)
    classes.schedule_rules(ctx)
    master.revisions_and_withdrawals(ctx)
    users.revisions(ctx)
    platform.tenant_admin_lifecycle(ctx)
    platform.licence_request(ctx)
    platform.sandbox_tenant(ctx)
    users.sign_in(ctx)
    workflows.phone_replacement(ctx)
    history.past_classes(ctx)
    workflows.leaves(ctx)
    live_class.run(ctx)
    daily_use.notices(ctx)
    daily_use.students(ctx)
    daily_use.teachers(ctx)
    daily_use.admin_reports(ctx)
    accounts.run(ctx)
    platform.platform_overview(ctx)

    credentials.write(args.base_url, args.super_email, args.super_password, args.password)
    print_summary(tally)
    return 1 if tally.failed else 0


if __name__ == "__main__":
    sys.exit(main())
