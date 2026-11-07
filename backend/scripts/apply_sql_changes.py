#!/usr/bin/env python3
"""Applies the SQL changes that `prisma db push` cannot make: dropping a column that holds values, and moving data.

The files live in prisma/sql_changes:
    before_push/  run before `prisma db push`, so a column the schema no longer has is already gone and the push sees
                  no data loss to refuse.
    after_push/   run after it, for changes that need a table the push has just built.

Each file runs once, in its own transaction, in name order, and is recorded in the sql_changes table. If anything is
pending and --backup-dir is given, a database backup is taken first and the run stops if the backup fails.

Usage:
    python scripts/apply_sql_changes.py before_push --backup-dir ../backups
    python scripts/apply_sql_changes.py after_push --backup-dir ../backups
"""
import argparse
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse, urlunparse

import psycopg2
from dotenv import load_dotenv

BACKEND = Path(__file__).resolve().parents[1]
CHANGES = BACKEND / "prisma" / "sql_changes"
PHASES = ("before_push", "after_push")
KEEP_BACKUPS = 5
LOCK_ID = 7315001
LEDGER = (
    'CREATE TABLE IF NOT EXISTS "sql_changes" ("name" TEXT NOT NULL, '
    '"applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "sql_changes_pkey" PRIMARY KEY ("name"))'
)


def without_query(url: str) -> str:
    """The URL Prisma reads carries `?schema=public`, which PostgreSQL clients do not understand."""
    return urlunparse(urlparse(url)._replace(query=""))


def back_up(url: str, directory: Path, label: str) -> Path:
    parts = urlparse(url)
    directory.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    target = directory / f"{stamp}_{label}.dump"
    # The password goes in the environment, not on the command line, where `ps` would show it.
    env = {
        **os.environ, "PGHOST": parts.hostname or "localhost", "PGPORT": str(parts.port or 5432),
        "PGUSER": unquote(parts.username or ""), "PGPASSWORD": unquote(parts.password or ""),
    }
    command = ["pg_dump", "--format=custom", f"--file={target}", parts.path.lstrip("/")]
    try:
        subprocess.run(command, env=env, check=True)
    except (OSError, subprocess.CalledProcessError) as error:
        target.unlink(missing_ok=True)
        raise RuntimeError(f"Backup failed, so nothing was changed: {error}") from error
    for old in sorted(directory.glob("*.dump"))[:-KEEP_BACKUPS]:
        old.unlink()
    return target


def apply_phase(url: str, phase: str, backup_dir: Path | None = None, changes_dir: Path = CHANGES) -> list[str]:
    """Runs every change of the phase that has not run yet and returns their names."""
    files = sorted((changes_dir / phase).glob("*.sql"))
    connection = psycopg2.connect(without_query(url))
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_lock(%s)", (LOCK_ID,))
            cursor.execute(LEDGER)
            cursor.execute('SELECT "name" FROM "sql_changes"')
            done = {row[0] for row in cursor.fetchall()}
        connection.commit()
        pending = [path for path in files if path.stem not in done]
        if pending and backup_dir:
            print(f"Backup written to {back_up(url, backup_dir, phase)}")
        for path in pending:
            run_one(connection, path)
            print(f"Applied {path.stem}")
        return [path.stem for path in pending]
    finally:
        connection.close()


def run_one(connection, path: Path) -> None:
    try:
        with connection.cursor() as cursor:
            cursor.execute(path.read_text())
            cursor.execute('INSERT INTO "sql_changes" ("name") VALUES (%s)', (path.stem,))
        connection.commit()
    except Exception:
        connection.rollback()
        raise


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("phase", choices=PHASES)
    parser.add_argument("--backup-dir", type=Path, help="Take a backup here before applying anything.")
    args = parser.parse_args(argv)
    load_dotenv(BACKEND / ".env")
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        print("DATABASE_URL is not set.", file=sys.stderr)
        return 1
    applied = apply_phase(url, args.phase, args.backup_dir)
    if not applied:
        print(f"No {args.phase} changes pending.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
