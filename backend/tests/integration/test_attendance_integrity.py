"""PRD 6.4 and the domain invariants, enforced by the database rather than by application code."""
from concurrent.futures import ThreadPoolExecutor

import psycopg2
import pytest
from psycopg2 import errors


def test_one_record_per_student_per_class(seed):
    tenant = seed.tenant()
    occurrence, student = seed.occurrence(tenant), seed.student(tenant)
    seed.record(tenant, occurrence, student)

    with pytest.raises(errors.UniqueViolation):
        seed.record(tenant, occurrence, student)


def test_simultaneous_marks_for_the_same_student_produce_exactly_one_record(seed, database_url):
    tenant = seed.tenant()
    occurrence, student = seed.occurrence(tenant), seed.student(tenant)

    def mark(attempt: int) -> str:
        connection = psycopg2.connect(database_url)
        connection.autocommit = True
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO attendance_records (id, tenant_id, occurrence_id, student_id, status, updated_at) "
                    "VALUES (%s, %s, %s, %s, 'PRESENT', now())",
                    (f"rec-{attempt}-{occurrence}", tenant, occurrence, student),
                )
            return "saved"
        except errors.UniqueViolation:
            return "duplicate"
        finally:
            connection.close()

    with ThreadPoolExecutor(max_workers=8) as pool:
        outcomes = list(pool.map(mark, range(8)))

    assert outcomes.count("saved") == 1 and outcomes.count("duplicate") == 7
    with seed.conn.cursor() as cursor:
        cursor.execute("SELECT count(*) FROM attendance_records WHERE occurrence_id = %s", (occurrence,))
        assert cursor.fetchone()[0] == 1


def test_deleting_a_student_who_has_attendance_is_refused(seed, conn):
    tenant = seed.tenant()
    student = seed.student(tenant)
    seed.record(tenant, seed.occurrence(tenant), student)

    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM students WHERE id = %s", (student,))


def test_deleting_a_class_that_has_attendance_is_refused(seed, conn):
    tenant = seed.tenant()
    occurrence = seed.occurrence(tenant)
    seed.record(tenant, occurrence, seed.student(tenant))

    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM class_occurrences WHERE id = %s", (occurrence,))


def test_deleting_a_record_that_has_an_audit_trail_is_refused(seed, conn):
    tenant = seed.tenant()
    record = seed.record(tenant, seed.occurrence(tenant), seed.student(tenant))
    seed.insert(
        "attendance_audit_logs", attendance_record_id=record, previous_status="ABSENT", new_status="PRESENT",
        changed_by_id=seed.user(tenant, "TEACHER"), reason="Marked in class",
    )

    with pytest.raises(errors.ForeignKeyViolation):
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM attendance_records WHERE id = %s", (record,))


def test_deleting_a_whole_institution_still_works(seed, conn):
    tenant = seed.tenant()
    seed.record(tenant, seed.occurrence(tenant), seed.student(tenant))

    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM tenants WHERE id = %s", (tenant,))
        cursor.execute("SELECT count(*) FROM attendance_records WHERE tenant_id = %s", (tenant,))
        assert cursor.fetchone()[0] == 0


@pytest.mark.parametrize(
    "day, start, end",
    [(0, "09:00", "10:00"), (8, "09:00", "10:00"), (1, "10:00", "09:00"), (1, "09:00", "09:00"), (1, "9:00", "10:00"),
     (1, "24:00", "25:00"), (1, "09:60", "10:00")],
)
def test_a_timetable_rule_needs_a_real_weekday_and_a_forward_time_range(seed, day, start, end):
    tenant = seed.tenant()

    with pytest.raises(errors.CheckViolation):
        seed.insert(
            "timetable_rules", tenant_id=tenant, course_section_id=seed.section(tenant), day_of_week=day,
            start_time=start, end_time=end, effective_from="2026-11-01",
        )


def test_an_unscheduled_class_may_start_and_end_at_the_same_minute(seed):
    tenant = seed.tenant()
    assert seed.insert(
        "class_occurrences", tenant_id=tenant, course_section_id=seed.section(tenant), date="2026-11-02",
        start_time="23:59", end_time="23:59", faculty_id=seed.teacher(tenant),
    )


def test_an_occurrence_cannot_end_before_it_starts(seed):
    tenant = seed.tenant()

    with pytest.raises(errors.CheckViolation):
        seed.insert(
            "class_occurrences", tenant_id=tenant, course_section_id=seed.section(tenant), date="2026-11-02",
            start_time="10:00", end_time="09:00", faculty_id=seed.teacher(tenant),
        )


def test_a_leave_cannot_end_before_it_starts(seed):
    tenant = seed.tenant()

    with pytest.raises(errors.CheckViolation):
        seed.insert(
            "leave_requests", tenant_id=tenant, student_id=seed.student(tenant), start_date="2026-11-05",
            end_date="2026-11-04", reason="Fever",
        )


def test_attendance_status_only_accepts_known_values(seed):
    tenant = seed.tenant()
    occurrence, student = seed.occurrence(tenant), seed.student(tenant)

    with pytest.raises(errors.InvalidTextRepresentation):
        seed.record(tenant, occurrence, student, status="MAYBE")
