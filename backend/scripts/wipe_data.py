#!/usr/bin/env python3
"""Empties every table of the database in backend/.env and clears the cached tenant lookups in Redis.

The schema, the migration history and the PostgreSQL extensions stay. Nothing runs unless the exact database name is
given, and `--backup` first saves a gzip-compressed pg_dump. Run it on the machine whose database it should wipe.

Usage:
  python scripts/wipe_data.py --show                          print the database this would wipe
  python scripts/wipe_data.py --confirm-db NAME [--backup F]  back up (optional), then wipe
"""
import argparse
import gzip
import os
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

import psycopg2
import redis
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
KEEP_TABLES = {"_prisma_migrations"}
TENANT_CACHE_PATTERN = "tenant:resolved:*"
CHUNK_BYTES = 1024 * 1024


def database():
    url = urlparse(os.environ["DATABASE_URL"])
    return url, url.path.lstrip("/")


def back_up(url, target: Path) -> None:
    if shutil.which("pg_dump") is None:
        raise SystemExit("pg_dump is not installed, so no backup can be made. Nothing was wiped.")
    env = {
        **os.environ, "PGHOST": url.hostname or "localhost", "PGPORT": str(url.port or 5432),
        "PGUSER": unquote(url.username or ""), "PGPASSWORD": unquote(url.password or ""),
        "PGDATABASE": url.path.lstrip("/"),
    }
    target.parent.mkdir(parents=True, exist_ok=True)
    dump = subprocess.Popen(["pg_dump", "--no-owner", "--no-privileges"], stdout=subprocess.PIPE, env=env)
    with gzip.open(target, "wb") as out:
        while chunk := dump.stdout.read(CHUNK_BYTES):
            out.write(chunk)
    if dump.wait() != 0:
        target.unlink(missing_ok=True)
        raise SystemExit("pg_dump failed. Nothing was wiped.")
    sys.stdout.write(f"Backup: {target}\n")


def truncate_tables(url) -> int:
    connection = psycopg2.connect(
        host=url.hostname, port=url.port or 5432, user=unquote(url.username or ""),
        password=unquote(url.password or ""), dbname=url.path.lstrip("/"),
    )
    with connection, connection.cursor() as cursor:
        cursor.execute("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
        tables = [name for (name,) in cursor.fetchall() if name not in KEEP_TABLES]
        if tables:
            cursor.execute("TRUNCATE " + ", ".join(f'"{name}"' for name in tables) + " CASCADE")
    connection.close()
    return len(tables)


def clear_tenant_cache() -> None:
    try:
        client = redis.Redis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379/0"), socket_connect_timeout=3)
        for key in client.scan_iter(TENANT_CACHE_PATTERN):
            client.delete(key)
    except redis.RedisError as err:
        sys.stderr.write(f"Redis cache not cleared ({err}); restart the backend to drop stale tenant lookups.\n")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--show", action="store_true")
    parser.add_argument("--confirm-db", default="")
    parser.add_argument("--backup", type=Path)
    args = parser.parse_args()
    url, name = database()
    if args.show:
        sys.stdout.write(f"{name} on {url.hostname}\n")
        return 0
    if args.confirm_db != name:
        sys.stderr.write(f"Refusing to wipe: --confirm-db must be exactly '{name}'.\n")
        return 2
    if args.backup:
        back_up(url, args.backup)
    sys.stdout.write(f"Emptied {truncate_tables(url)} tables in {name}.\n")
    clear_tenant_cache()
    return 0


if __name__ == "__main__":
    sys.exit(main())
