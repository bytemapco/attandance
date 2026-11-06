"""The database itself refuses to mix tenants (PRD: tenant isolation)."""
import uuid
from pathlib import Path

import psycopg2
import pytest
from psycopg2 import errors


def test_the_extension_for_face_embeddings_is_installed(conn):
    with conn.cursor() as cursor:
        cursor.execute("SELECT 1 FROM pg_extension WHERE extname = 'vector'")
        assert cursor.fetchone() is not None


def test_every_tenant_table_has_its_same_tenant_trigger(conn):
    with conn.cursor() as cursor:
        cursor.execute("SELECT count(*) FROM pg_trigger WHERE tgname LIKE '%\\_same\\_tenant'")
        assert cursor.fetchone()[0] == 14


def test_hardening_can_be_applied_twice(conn):
    hardening = Path(__file__).resolve().parents[2] / "prisma" / "hardening.sql"

    with conn.cursor() as cursor:
        cursor.execute(hardening.read_text())


def test_a_student_may_use_a_department_of_their_own_tenant(seed):
    tenant = seed.tenant()
    assert seed.student(tenant, seed.department(tenant))


def test_a_student_cannot_be_placed_in_another_tenants_department(seed):
    tenant_a, tenant_b = seed.tenant(), seed.tenant()
    foreign_department = seed.department(tenant_b)

    with pytest.raises(errors.CheckViolation, match="Cross-tenant"):
        seed.student(tenant_a, foreign_department)


def test_a_student_cannot_belong_to_a_user_of_another_tenant(seed):
    tenant_a, tenant_b = seed.tenant(), seed.tenant()

    with pytest.raises(errors.CheckViolation):
        seed.insert(
            "students", tenant_id=tenant_a, user_id=seed.user(tenant_b), department_id=seed.department(tenant_a),
            enrollment_number="X1",
        )


def test_a_mark_cannot_link_a_class_of_one_tenant_to_a_student_of_another(seed):
    tenant_a, tenant_b = seed.tenant(), seed.tenant()
    occurrence = seed.occurrence(tenant_a)
    foreign_student = seed.student(tenant_b)

    with pytest.raises(errors.CheckViolation):
        seed.record(tenant_a, occurrence, foreign_student)


def test_a_student_cannot_be_enrolled_in_another_tenants_subject(seed):
    tenant_a, tenant_b = seed.tenant(), seed.tenant()

    with pytest.raises(errors.CheckViolation):
        seed.insert("course_enrollments", course_section_id=seed.section(tenant_b), student_id=seed.student(tenant_a))


def test_a_class_cannot_take_a_member_from_another_tenant(seed):
    tenant_a, tenant_b = seed.tenant(), seed.tenant()
    group = seed.insert("student_groups", tenant_id=tenant_a, department_id=seed.department(tenant_a), batch="A-1")

    with pytest.raises(errors.CheckViolation):
        seed.insert("class_members", tenant_id=tenant_a, group_id=group, student_id=seed.student(tenant_b))


def test_a_timetable_rule_cannot_use_another_tenants_room(seed):
    tenant_a, tenant_b = seed.tenant(), seed.tenant()
    foreign_room = seed.insert("classrooms", tenant_id=tenant_b, name="Room 1")

    with pytest.raises(errors.CheckViolation):
        seed.insert(
            "timetable_rules", tenant_id=tenant_a, course_section_id=seed.section(tenant_a), classroom_id=foreign_room,
            day_of_week=1, start_time="09:00", end_time="10:00", effective_from="2026-11-01",
        )


def test_only_a_super_admin_can_exist_without_a_tenant(seed):
    with pytest.raises(errors.CheckViolation):
        seed.insert("users", email=f"{uuid.uuid4().hex}@example.test", hashed_password="x", role="STUDENT")

    assert seed.insert("users", email=f"{uuid.uuid4().hex}@example.test", hashed_password="x", role="SUPER_ADMIN")


def test_the_same_enrollment_number_may_exist_in_two_institutions(seed):
    tenant_a, tenant_b = seed.tenant(), seed.tenant()
    for tenant in (tenant_a, tenant_b):
        seed.insert(
            "students", tenant_id=tenant, user_id=seed.user(tenant), department_id=seed.department(tenant),
            enrollment_number="SAME-1",
        )


def test_the_same_enrollment_number_twice_in_one_institution_is_refused(seed):
    tenant = seed.tenant()
    seed.insert(
        "students", tenant_id=tenant, user_id=seed.user(tenant), department_id=seed.department(tenant),
        enrollment_number="DUP-1",
    )

    with pytest.raises(psycopg2.errors.UniqueViolation):
        seed.insert(
            "students", tenant_id=tenant, user_id=seed.user(tenant), department_id=seed.department(tenant),
            enrollment_number="DUP-1",
        )
