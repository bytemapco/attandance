"""Biometric consent (PRD 8) and class membership rules, enforced by partial unique indexes."""
import pytest
from psycopg2 import errors


def consent(seed, tenant, student, **extra):
    return seed.insert("biometric_consents", tenant_id=tenant, student_id=student, policy_version="2026.1", **extra)


def test_a_student_has_no_consent_until_one_is_recorded(seed, conn):
    student = seed.student(seed.tenant())

    with conn.cursor() as cursor:
        cursor.execute("SELECT count(*) FROM biometric_consents WHERE student_id = %s", (student,))
        assert cursor.fetchone()[0] == 0


def test_only_one_consent_can_be_active_per_student(seed):
    tenant = seed.tenant()
    student = seed.student(tenant)
    consent(seed, tenant, student)

    with pytest.raises(errors.UniqueViolation):
        consent(seed, tenant, student)


def test_after_revoking_a_student_can_grant_consent_again(seed, conn):
    tenant = seed.tenant()
    student = seed.student(tenant)
    first = consent(seed, tenant, student)
    with conn.cursor() as cursor:
        cursor.execute("UPDATE biometric_consents SET revoked_at = now() + interval '1 second' WHERE id = %s", (first,))

    assert consent(seed, tenant, student)


def test_consent_cannot_be_revoked_before_it_was_granted(seed, conn):
    tenant = seed.tenant()
    first = consent(seed, tenant, seed.student(tenant))

    with pytest.raises(errors.CheckViolation):
        with conn.cursor() as cursor:
            cursor.execute("UPDATE biometric_consents SET revoked_at = granted_at - interval '1 day' WHERE id = %s", (first,))


def test_consent_cannot_name_a_student_of_another_tenant(seed):
    tenant_a, tenant_b = seed.tenant(), seed.tenant()

    with pytest.raises(errors.CheckViolation):
        consent(seed, tenant_a, seed.student(tenant_b))


def test_a_consenting_students_record_cannot_be_deleted_away(seed, conn):
    tenant = seed.tenant()
    student = seed.student(tenant)
    consent(seed, tenant, student)

    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM students WHERE id = %s", (student,))


def group(seed, tenant, batch):
    return seed.insert("student_groups", tenant_id=tenant, department_id=seed.department(tenant), batch=batch)


def test_a_student_can_be_active_in_only_one_class(seed):
    tenant = seed.tenant()
    student = seed.student(tenant)
    seed.insert("class_members", tenant_id=tenant, group_id=group(seed, tenant, "A-1"), student_id=student, status="ACTIVE")

    with pytest.raises(errors.UniqueViolation):
        seed.insert("class_members", tenant_id=tenant, group_id=group(seed, tenant, "B-1"), student_id=student, status="ACTIVE")


def test_a_transferred_membership_does_not_block_a_new_class(seed):
    tenant = seed.tenant()
    student = seed.student(tenant)
    seed.insert("class_members", tenant_id=tenant, group_id=group(seed, tenant, "A-1"), student_id=student, status="TRANSFERRED")

    assert seed.insert(
        "class_members", tenant_id=tenant, group_id=group(seed, tenant, "B-1"), student_id=student, status="ACTIVE"
    )


def test_a_student_appears_once_per_class_even_across_statuses(seed):
    tenant = seed.tenant()
    student = seed.student(tenant)
    same_group = group(seed, tenant, "A-1")
    seed.insert("class_members", tenant_id=tenant, group_id=same_group, student_id=student, status="TRANSFERRED")

    with pytest.raises(errors.UniqueViolation):
        seed.insert("class_members", tenant_id=tenant, group_id=same_group, student_id=student, status="ACTIVE")
