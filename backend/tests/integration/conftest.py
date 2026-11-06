"""Integration tier: a real PostgreSQL (pgvector) and Redis.

Needs TEST_DATABASE_URL (and TEST_REDIS_URL for the Redis tests). The schema is built the same way production
builds it: `prisma db push`, then prisma/hardening.sql for the protections Prisma cannot express.
"""
import os
import subprocess
import sys
import uuid
from datetime import date, datetime
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import urlparse

import psycopg2
import pytest
import redis as redis_sync
from fastapi.testclient import TestClient

BACKEND = Path(__file__).resolve().parents[2]
UPDATED_AT_TABLES = {
    "tenants", "users", "departments", "designations", "batches", "students", "teachers", "subjects",
    "classrooms", "student_groups", "course_sections", "class_occurrences", "attendance_records",
    "leave_requests",
}


def _test_database_url() -> str:
    url = os.environ.get("TEST_DATABASE_URL")
    if not url:
        pytest.skip("TEST_DATABASE_URL is not set; integration tests need a PostgreSQL database.")
    name = urlparse(url).path.lstrip("/")
    if "test" not in name:
        pytest.fail(f"Refusing to wipe database '{name}': the name of a test database must contain 'test'.")
    return url


@pytest.fixture(scope="session")
def database_url() -> str:
    url = _test_database_url()
    env = {**os.environ, "DATABASE_URL": url}
    subprocess.run(
        [sys.executable, "-m", "prisma", "db", "push", "--force-reset", "--skip-generate"],
        cwd=BACKEND, env=env, check=True, capture_output=True,
    )
    connection = psycopg2.connect(url)
    connection.autocommit = True
    with connection.cursor() as cursor:
        cursor.execute((BACKEND / "prisma" / "hardening.sql").read_text())
    connection.close()
    return url


@pytest.fixture
def conn(database_url):
    connection = psycopg2.connect(database_url)
    connection.autocommit = True
    yield connection
    connection.close()


class Seed:
    """Inserts rows with raw SQL, so a test controls exactly which tenant every row belongs to."""

    def __init__(self, connection):
        self.conn = connection

    def insert(self, table: str, **values) -> str:
        values.setdefault("id", uuid.uuid4().hex)
        if table in UPDATED_AT_TABLES:
            values.setdefault("updated_at", datetime.utcnow())
        columns = ", ".join(values)
        placeholders = ", ".join(["%s"] * len(values))
        with self.conn.cursor() as cursor:
            cursor.execute(f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) RETURNING id", list(values.values()))
            return cursor.fetchone()[0]

    def tenant(self) -> str:
        slug = f"t-{uuid.uuid4().hex[:10]}"
        return self.insert("tenants", slug=slug, name=slug)

    def user(self, tenant_id, role="STUDENT") -> str:
        return self.insert(
            "users", email=f"{uuid.uuid4().hex}@example.test", hashed_password="x", tenant_id=tenant_id, role=role
        )

    def department(self, tenant_id) -> str:
        return self.insert("departments", tenant_id=tenant_id, code=uuid.uuid4().hex[:6], name="Computer Engineering")

    def student(self, tenant_id, department_id=None) -> str:
        return self.insert(
            "students", tenant_id=tenant_id, user_id=self.user(tenant_id),
            department_id=department_id or self.department(tenant_id), enrollment_number=uuid.uuid4().hex[:8],
        )

    def teacher(self, tenant_id) -> str:
        return self.insert(
            "teachers", tenant_id=tenant_id, user_id=self.user(tenant_id, "TEACHER"),
            department_id=self.department(tenant_id),
            designation_id=self.insert("designations", tenant_id=tenant_id, code=uuid.uuid4().hex[:6], name="Lecturer"),
            employee_id=uuid.uuid4().hex[:8], first_name="Test", last_name="Teacher",
        )

    def section(self, tenant_id) -> str:
        subject = self.insert("subjects", tenant_id=tenant_id, code=uuid.uuid4().hex[:6], name="Maths")
        return self.insert("course_sections", tenant_id=tenant_id, subject_id=subject, name="CE-A-1")

    def occurrence(self, tenant_id, section_id=None, teacher_id=None) -> str:
        return self.insert(
            "class_occurrences", tenant_id=tenant_id, course_section_id=section_id or self.section(tenant_id),
            date=date(2026, 11, 2), start_time="09:00", end_time="10:00",
            faculty_id=teacher_id or self.teacher(tenant_id),
        )

    def record(self, tenant_id, occurrence_id, student_id, status="PRESENT") -> str:
        return self.insert(
            "attendance_records", tenant_id=tenant_id, occurrence_id=occurrence_id, student_id=student_id,
            status=status,
        )


@pytest.fixture
def seed(conn) -> Seed:
    return Seed(conn)


@pytest.fixture
def query_counter(monkeypatch):
    """Counts the queries the application sends to the database. Reset `.count` before the call being measured."""
    from prisma.engine.query import QueryEngine

    counter = SimpleNamespace(count=0)
    original = QueryEngine.query

    async def counting(self, content, *, tx_id):
        counter.count += 1
        return await original(self, content, tx_id=tx_id)

    monkeypatch.setattr(QueryEngine, "query", counting)
    return counter


@pytest.fixture(scope="module")
def client(database_url):
    if not os.environ.get("TEST_REDIS_URL"):
        pytest.skip("TEST_REDIS_URL is not set; the API tests need Redis.")
    from main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def fresh_rate_limits():
    url = os.environ.get("TEST_REDIS_URL")
    if url:
        redis_sync.Redis.from_url(url).flushdb()
