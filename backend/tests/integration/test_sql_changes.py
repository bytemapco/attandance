"""The deploy applies the SQL that `prisma db push` cannot: dropping columns that hold values, and moving data.

The first real failure was a push that refused to drop `departments.head` and four other populated columns, which
stopped the whole deploy. These tests run the same push against a database in that state."""
import os
import subprocess
import sys
import uuid

import psycopg2
import pytest

from scripts.apply_sql_changes import CHANGES, PHASES, apply_phase
from tests.integration.conftest import BACKEND

DROP_COLUMNS = "20261108000000_remove_unused_master_data_fields"
MOVE_ANNOUNCEMENTS = "20261107000000_move_announcements"


@pytest.fixture
def token(conn):
    """A prefix for this test's files and tables, so nothing it leaves behind can meet another test."""
    prefix = f"c{uuid.uuid4().hex[:8]}"
    yield prefix
    with conn.cursor() as cursor:
        cursor.execute("SELECT tablename FROM pg_tables WHERE tablename LIKE %s", (f"scratch_{prefix}%",))
        for (table,) in cursor.fetchall():
            cursor.execute(f'DROP TABLE "{table}"')
        cursor.execute('DELETE FROM "sql_changes" WHERE "name" LIKE %s', (f"{prefix}%",))


@pytest.fixture
def folder(tmp_path):
    for phase in PHASES:
        (tmp_path / phase).mkdir()
    return tmp_path


def add(folder, phase, name, sql):
    (folder / phase / f"{name}.sql").write_text(sql)


def table_exists(conn, name) -> bool:
    with conn.cursor() as cursor:
        cursor.execute("SELECT to_regclass(%s)", (f"public.{name}",))
        return cursor.fetchone()[0] is not None


def forget(conn, name) -> None:
    with conn.cursor() as cursor:
        cursor.execute('DELETE FROM "sql_changes" WHERE "name" = %s', (name,))


def push(url) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, "-m", "prisma", "db", "push", "--skip-generate"],
        cwd=BACKEND, env={**os.environ, "DATABASE_URL": url}, capture_output=True, text=True,
    )


def test_a_change_runs_once_and_is_remembered(database_url, conn, folder, token):
    add(folder, "before_push", f"{token}_a", f'CREATE TABLE "scratch_{token}" (n int); INSERT INTO "scratch_{token}" VALUES (1);')

    first = apply_phase(database_url, "before_push", changes_dir=folder)
    second = apply_phase(database_url, "before_push", changes_dir=folder)

    assert (first, second) == ([f"{token}_a"], [])
    with conn.cursor() as cursor:
        cursor.execute(f'SELECT count(*) FROM "scratch_{token}"')
        assert cursor.fetchone()[0] == 1


def test_changes_run_in_name_order_and_only_for_their_own_phase(database_url, conn, folder, token):
    add(folder, "before_push", f"{token}_2_fill", f'INSERT INTO "scratch_{token}" VALUES (1);')
    add(folder, "before_push", f"{token}_1_create", f'CREATE TABLE "scratch_{token}" (n int);')
    add(folder, "after_push", f"{token}_3_later", f'INSERT INTO "scratch_{token}" VALUES (2);')

    before = apply_phase(database_url, "before_push", changes_dir=folder)
    after = apply_phase(database_url, "after_push", changes_dir=folder)

    assert before == [f"{token}_1_create", f"{token}_2_fill"]
    assert after == [f"{token}_3_later"]


def test_a_failing_change_is_rolled_back_and_stops_the_ones_after_it(database_url, conn, folder, token):
    add(folder, "before_push", f"{token}_1_ok", f'CREATE TABLE "scratch_{token}_ok" (n int);')
    add(folder, "before_push", f"{token}_2_bad", f'CREATE TABLE "scratch_{token}_bad" (n int); SELECT 1/0;')
    add(folder, "before_push", f"{token}_3_never", f'CREATE TABLE "scratch_{token}_never" (n int);')

    with pytest.raises(psycopg2.Error):
        apply_phase(database_url, "before_push", changes_dir=folder)

    assert table_exists(conn, f"scratch_{token}_ok")
    assert not table_exists(conn, f"scratch_{token}_bad"), "the failed change must leave nothing behind"
    assert not table_exists(conn, f"scratch_{token}_never")
    with conn.cursor() as cursor:
        cursor.execute('SELECT "name" FROM "sql_changes" WHERE "name" LIKE %s ORDER BY "name"', (f"{token}%",))
        assert [row[0] for row in cursor.fetchall()] == [f"{token}_1_ok"]


def test_a_failed_backup_stops_everything_before_any_change(database_url, conn, folder, token, tmp_path, monkeypatch):
    monkeypatch.setenv("PATH", str(tmp_path))
    add(folder, "before_push", f"{token}_a", f'CREATE TABLE "scratch_{token}" (n int);')

    with pytest.raises(RuntimeError, match="Backup failed"):
        apply_phase(database_url, "before_push", backup_dir=tmp_path / "backups", changes_dir=folder)

    assert not table_exists(conn, f"scratch_{token}")


def test_dropping_columns_that_hold_values_no_longer_stops_a_push(database_url, conn, seed):
    tenant = seed.tenant()
    with conn.cursor() as cursor:
        cursor.execute('ALTER TABLE "departments" ADD COLUMN "head" TEXT, ADD COLUMN "description" TEXT')
        for table, column in (("designations", "description"), ("subjects", "description"), ("classrooms", "building")):
            cursor.execute(f'ALTER TABLE "{table}" ADD COLUMN "{column}" TEXT')
    seed.insert("departments", tenant_id=tenant, code="CE", name="Computer Engineering", head="Dr Rao", description="x")
    seed.insert("designations", tenant_id=tenant, code="LEC", name="Lecturer", description="x")
    seed.insert("subjects", tenant_id=tenant, code="MA", name="Maths", description="x")
    seed.insert("classrooms", tenant_id=tenant, name="Room 1", building="Main")
    forget(conn, DROP_COLUMNS)

    refused = push(database_url)
    assert refused.returncode != 0 and "data loss" in (refused.stdout + refused.stderr).lower()

    assert apply_phase(database_url, "before_push") == [DROP_COLUMNS]

    assert push(database_url).returncode == 0
    assert apply_phase(database_url, "before_push") == []


def test_the_announcement_move_turns_shared_notifications_into_announcements(database_url, conn, seed):
    tenant = seed.tenant()
    students = [seed.user(tenant, "STUDENT") for _ in range(2)]
    teacher = seed.user(tenant, "TEACHER")
    shared = seed.insert("notifications", tenant_id=tenant, role="STUDENT", title="Exam week", message="Starts Monday")
    personal = seed.insert("notifications", tenant_id=tenant, user_id=teacher, title="Your leave", message="Approved")
    forget(conn, MOVE_ANNOUNCEMENTS)

    assert apply_phase(database_url, "after_push") == [MOVE_ANNOUNCEMENTS]

    with conn.cursor() as cursor:
        cursor.execute('SELECT "audience", "audience_count" FROM "announcements" WHERE "id" = %s', (shared,))
        assert cursor.fetchone() == ("STUDENT", 2)
        cursor.execute('SELECT "user_id" FROM "announcement_reads" WHERE "announcement_id" = %s', (shared,))
        assert sorted(row[0] for row in cursor.fetchall()) == sorted(students)
        cursor.execute('SELECT count(*) FROM "notifications" WHERE "id" = %s', (shared,))
        assert cursor.fetchone()[0] == 0, "the shared notification becomes the announcement"
        cursor.execute('SELECT count(*) FROM "notifications" WHERE "id" = %s', (personal,))
        assert cursor.fetchone()[0] == 1, "a notification for one person stays"


def test_running_the_announcement_move_again_leaves_a_newer_announcement_unread(database_url, conn, seed):
    tenant = seed.tenant()
    seed.user(tenant, "STUDENT")
    seed.insert("notifications", tenant_id=tenant, role="STUDENT", title="Old", message="Already history")
    forget(conn, MOVE_ANNOUNCEMENTS)
    apply_phase(database_url, "after_push")
    fresh = seed.insert("announcements", tenant_id=tenant, audience="STUDENT", title="New", message="Not read yet")

    forget(conn, MOVE_ANNOUNCEMENTS)
    apply_phase(database_url, "after_push")

    with conn.cursor() as cursor:
        cursor.execute('SELECT count(*) FROM "announcement_reads" WHERE "announcement_id" = %s', (fresh,))
        assert cursor.fetchone()[0] == 0, "an announcement sent after the move must stay unread"


def test_every_change_file_belongs_to_a_known_phase():
    on_disk = {path.name for path in CHANGES.iterdir()}
    assert on_disk == set(PHASES)
