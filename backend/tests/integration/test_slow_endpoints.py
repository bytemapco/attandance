"""The teacher's schedule and closing a class, against a real database: right answers, and a query count that
stays flat as the timetable and the class grow (it used to grow with every rule and every student)."""
from datetime import date, datetime

import pytest

from app.core.security import create_access_token

WEEK_START, WEEK_END = date(2026, 11, 2), date(2026, 11, 8)  # Monday to Sunday
ENROLLED_SINCE = datetime(2026, 8, 1)
EVERY_WEEKDAY = (1, 2, 3, 4, 5)


class College:
    """One institution: our teacher, another teacher, and a timetable of weekly rules for both."""

    def __init__(self, seed, conn, sections: int):
        self.seed, self.conn = seed, conn
        self.tenant_id = seed.tenant()
        self.department_id = seed.department(self.tenant_id)
        self.teacher_id = seed.teacher(self.tenant_id)
        self.other_teacher_id = seed.teacher(self.tenant_id)
        self.section_ids = [seed.section(self.tenant_id) for _ in range(sections)]
        for index, section_id in enumerate(self.section_ids):
            teacher = self.teacher_id if index % 2 == 0 else self.other_teacher_id
            for weekday in EVERY_WEEKDAY:
                seed.insert(
                    "timetable_rules", tenant_id=self.tenant_id, course_section_id=section_id, day_of_week=weekday,
                    start_time=f"{8 + index % 8:02d}:00", end_time=f"{9 + index % 8:02d}:00", teacher_id=teacher,
                    effective_from=datetime(2026, 1, 1),
                )

    @property
    def mine(self) -> int:
        """How many of the sections are taught by our teacher."""
        return len(self.section_ids[0::2])

    def headers(self) -> dict:
        user_id = self._one("SELECT user_id FROM teachers WHERE id = %s", self.teacher_id)
        token = create_access_token(user_id, "TEACHER", extra_data={"tid": self.tenant_id, "tenant_id": self.tenant_id})
        return {"Authorization": f"Bearer {token}", "X-Tenant-ID": self.tenant_id}

    def enrol(self, section_id: str, students: int) -> list[str]:
        ids = [self.seed.student(self.tenant_id, self.department_id) for _ in range(students)]
        for student_id in ids:
            self.seed.insert("course_enrollments", course_section_id=section_id, student_id=student_id, enrolled_at=ENROLLED_SINCE)
        return ids

    def _one(self, sql: str, *params):
        with self.conn.cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.fetchone()[0]

    def scalar(self, sql: str, *params):
        return self._one(sql, *params)


def week_query(client, college):
    return client.get(
        "/api/v1/faculty/daily-schedule",
        params={"target_date": WEEK_START.isoformat(), "end_date": WEEK_END.isoformat()},
        headers=college.headers(),
    )


def queries_for_a_week(client, college, counter) -> int:
    week_query(client, college)  # the first call also creates the dated classes
    counter.count = 0
    assert week_query(client, college).status_code == 200
    return counter.count


class TestDailySchedule:
    def test_it_lists_only_my_classes_for_every_day_of_the_range(self, client, seed, conn):
        college = College(seed, conn, sections=6)

        classes = week_query(client, college).json()

        assert len(classes) == college.mine * len(EVERY_WEEKDAY)
        assert {c["faculty_id"] for c in classes} == {college.teacher_id}
        assert [c["date"][:10] for c in classes] == sorted(c["date"][:10] for c in classes)

    def test_it_counts_enrolled_students_and_present_students_in_the_database(self, client, seed, conn):
        college = College(seed, conn, sections=2)
        students = college.enrol(college.section_ids[0], 12)
        first = week_query(client, college).json()[0]
        for student_id in students[:5]:
            seed.record(college.tenant_id, first["id"], student_id, "PRESENT")
        seed.record(college.tenant_id, first["id"], students[5], "ABSENT")

        again = {c["id"]: c for c in week_query(client, college).json()}[first["id"]]

        assert again["total_enrolled"] == 12 and again["present_count"] == 5

    def test_asking_again_creates_no_duplicate_classes(self, client, seed, conn):
        college = College(seed, conn, sections=4)
        week_query(client, college)
        made = college.scalar("SELECT count(*) FROM class_occurrences WHERE tenant_id = %s", college.tenant_id)

        week_query(client, college)

        assert college.scalar("SELECT count(*) FROM class_occurrences WHERE tenant_id = %s", college.tenant_id) == made
        assert made == len(college.section_ids) * len(EVERY_WEEKDAY)

    def test_a_saturday_class_is_not_made_while_saturdays_are_off(self, client, seed, conn):
        college = College(seed, conn, sections=2)
        seed.insert(
            "timetable_rules", tenant_id=college.tenant_id, course_section_id=college.section_ids[0], day_of_week=6,
            start_time="10:00", end_time="11:00", teacher_id=college.teacher_id, effective_from=datetime(2026, 1, 1),
        )

        classes = week_query(client, college).json()

        assert all(date.fromisoformat(c["date"][:10]).isoweekday() != 6 for c in classes)

    def test_the_query_count_does_not_grow_with_the_timetable(self, client, seed, conn, query_counter):
        small = queries_for_a_week(client, College(seed, conn, sections=4), query_counter)
        large = queries_for_a_week(client, College(seed, conn, sections=40), query_counter)

        assert large == small
        assert small <= 12


class TestStoppingAClass:
    def occurrence_for(self, seed, college, students: int, already_present: int):
        section_id = college.section_ids[0]
        enrolled = college.enrol(section_id, students)
        occurrence_id = seed.occurrence(college.tenant_id, section_id, college.teacher_id)
        for student_id in enrolled[:already_present]:
            seed.record(college.tenant_id, occurrence_id, student_id, "PRESENT")
        return occurrence_id, enrolled

    def stop(self, client, college, occurrence_id):
        return client.post(f"/api/v1/faculty/occurrences/{occurrence_id}/stop", headers=college.headers())

    def test_everyone_without_a_mark_becomes_absent_with_an_audit_entry_and_the_class_locks(self, client, seed, conn):
        college = College(seed, conn, sections=2)
        occurrence_id, students = self.occurrence_for(seed, college, students=40, already_present=10)

        response = self.stop(client, college, occurrence_id)

        assert response.status_code == 200 and response.json()["absent_marked_count"] == 30
        absent = "SELECT count(*) FROM attendance_records WHERE occurrence_id = %s AND status = 'ABSENT'"
        assert college.scalar(absent, occurrence_id) == 30
        audit = (
            "SELECT count(*) FROM attendance_audit_logs l JOIN attendance_records r ON r.id = l.attendance_record_id "
            "WHERE r.occurrence_id = %s"
        )
        assert college.scalar(audit, occurrence_id) == 30
        locked = "SELECT is_attendance_locked AND status = 'CONDUCTED' FROM class_occurrences WHERE id = %s"
        assert college.scalar(locked, occurrence_id) is True

    def test_streaks_follow_the_closed_class(self, client, seed, conn):
        college = College(seed, conn, sections=2)
        occurrence_id, students = self.occurrence_for(seed, college, students=6, already_present=3)

        self.stop(client, college, occurrence_id)

        streak = "SELECT current_streak FROM students WHERE id = %s"
        assert [college.scalar(streak, s) for s in students] == [1, 1, 1, 0, 0, 0]

    def test_closing_twice_does_not_mark_anyone_twice(self, client, seed, conn):
        college = College(seed, conn, sections=2)
        occurrence_id, _ = self.occurrence_for(seed, college, students=8, already_present=2)

        self.stop(client, college, occurrence_id)
        self.stop(client, college, occurrence_id)

        assert college.scalar("SELECT count(*) FROM attendance_records WHERE occurrence_id = %s", occurrence_id) == 8

    def test_the_query_count_does_not_grow_with_the_class(self, client, seed, conn, query_counter):
        counts = []
        for students in (5, 60):
            college = College(seed, conn, sections=2)
            occurrence_id, _ = self.occurrence_for(seed, college, students=students, already_present=students // 5)
            query_counter.count = 0
            assert self.stop(client, college, occurrence_id).status_code == 200
            counts.append(query_counter.count)

        assert counts[0] == counts[1]
        assert counts[1] <= 20

    @pytest.mark.parametrize("students", [30])
    def test_a_teacher_cannot_stop_someone_elses_class(self, client, seed, conn, students):
        college = College(seed, conn, sections=2)
        section_id = college.section_ids[1]
        occurrence_id = seed.occurrence(college.tenant_id, section_id, college.other_teacher_id)

        assert self.stop(client, college, occurrence_id).status_code == 403
