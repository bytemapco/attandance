#!/usr/bin/env python3
"""Fills in a missing tenant_id on existing rows, before `prisma db push` makes the column NOT NULL.

`prisma db push` does not run the SQL migrations, so a database that was never migrated by hand still holds rows
with no tenant. This is the backfill from migration 20261102000000_schema_hardening: each row takes the tenant of
the record it belongs to. It only touches rows where tenant_id IS NULL, so it is safe to run on every deploy.

Rows that still have no tenant afterwards belong to nobody. The script lists them and exits with status 1 so the
deploy stops with a clear message instead of a Prisma error. Assign or remove those rows by hand.
"""
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

import psycopg2
from dotenv import load_dotenv

BACKFILLS = [
    (
        "students",
        "UPDATE students s SET tenant_id = u.tenant_id FROM users u "
        "WHERE s.user_id = u.id AND s.tenant_id IS NULL AND u.tenant_id IS NOT NULL",
    ),
    (
        "teachers",
        "UPDATE teachers t SET tenant_id = u.tenant_id FROM users u "
        "WHERE t.user_id = u.id AND t.tenant_id IS NULL AND u.tenant_id IS NOT NULL",
    ),
    (
        "leave_requests",
        "UPDATE leave_requests l SET tenant_id = s.tenant_id FROM students s "
        "WHERE l.student_id = s.id AND l.tenant_id IS NULL AND s.tenant_id IS NOT NULL",
    ),
    (
        "device_change_requests",
        "UPDATE device_change_requests d SET tenant_id = s.tenant_id FROM students s "
        "WHERE d.student_id = s.id AND d.tenant_id IS NULL AND s.tenant_id IS NOT NULL",
    ),
]


def connect():
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    url = urlparse(os.environ["DATABASE_URL"])
    return psycopg2.connect(
        host=url.hostname, port=url.port or 5432, user=url.username, password=url.password, dbname=url.path.lstrip("/")
    )


def has_tenant_column(cur, table: str) -> bool:
    cur.execute(
        "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = %s AND column_name = 'tenant_id'",
        (table,),
    )
    return cur.fetchone() is not None


def main() -> int:
    orphans: dict[str, int] = {}
    conn = connect()
    with conn, conn.cursor() as cur:
        for table, statement in BACKFILLS:
            if not has_tenant_column(cur, table):
                continue
            cur.execute(statement)
            sys.stdout.write(f"{table}: assigned a tenant to {cur.rowcount} rows\n")
            cur.execute(f"SELECT count(*) FROM {table} WHERE tenant_id IS NULL")
            left = cur.fetchone()[0]
            if left:
                orphans[table] = left
    conn.close()
    for table, left in orphans.items():
        sys.stderr.write(f"{table}: {left} rows have no tenant and cannot be derived. Assign or remove them first.\n")
    return 1 if orphans else 0


if __name__ == "__main__":
    sys.exit(main())
