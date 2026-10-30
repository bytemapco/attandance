#!/usr/bin/env python3
"""CLI Entrypoint for Smart Attendance System Data-Seeding Pipeline."""

import argparse
import asyncio
import sys
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from scripts.seeder.config import resolve_seeder_config
from scripts.seeder.orchestrator import SeederOrchestrator


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Clean, API-driven Data Seeding Pipeline for Smart Attendance System.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Seed local development instance (http://localhost:8000/api/v1)
  python -m scripts.seed --local

  # Safely seed production instance
  python -m scripts.seed --prod --confirm-prod
        """,
    )

    env_group = parser.add_mutually_exclusive_group(required=True)
    env_group.add_argument(
        "--local",
        action="store_true",
        help="Target local development environment (http://localhost:8000/api/v1).",
    )
    env_group.add_argument(
        "--prod",
        action="store_true",
        help="Target production environment. Requires '--confirm-prod'.",
    )

    parser.add_argument(
        "--confirm-prod",
        action="store_true",
        help="Required safety flag to confirm execution against production.",
    )
    parser.add_argument(
        "--api-url",
        type=str,
        default="",
        help="Optional explicit API base URL override.",
    )

    return parser.parse_args()


async def main_async() -> None:
    args = parse_arguments()

    if args.api_url:
        import os
        os.environ["API_BASE_URL"] = args.api_url

    config = resolve_seeder_config(
        is_prod=args.prod,
        confirm_prod=args.confirm_prod,
    )

    orchestrator = SeederOrchestrator(config)
    await orchestrator.run()


def main() -> None:
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        print("\n[ABORTED] Seeding interrupted by user.")
        sys.exit(130)
    except Exception as exc:
        print(f"\n❌ [SEEDING FAILED] {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
