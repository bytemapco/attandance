"""Reports, checked against figures worked out by hand.

Section: four closed classes on days 1-4 and three students.
  s1 joined before day 1: PRESENT, PRESENT, ABSENT, LATE            -> 3 of 4 = 75.0
  s2 joined on day 3:     (day 1-2 not counted), ABSENT, PRESENT    -> 1 of 2 = 50.0
  s3 joined before day 1: ABSENT x4                                 -> 0 of 4 = 0.0
"""
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.schemas.reports import ReportMeta
from app.services.reports import builders, loader, service
from app.services.reports.service import ReportQuery
from app.services.reports.standing import classes_needed, combine, standing
from app.services.reports.types import Learner, Lecture, SectionData

DAYS = [date(2026, 10, d) for d in (5, 6, 7, 8)]
META = ReportMeta(scope="CSE-A-1", threshold=75.0, date_to=DAYS[-1], generated_at=datetime.now(timezone.utc))


def make_section() -> SectionData:
    lectures = [Lecture(f"L{i}", day, "09:00", "09:55") for i, day in enumerate(DAYS, start=1)]
    learners = [
        Learner("s1", "Aarav Sharma", "R1", DAYS[0]),
        Learner("s2", "Ananya Iyer", "R2", DAYS[2]),
        Learner("s3", "Rohan Patil", "R3", DAYS[0]),
    ]
    marks = {
        ("L1", "s1"): "PRESENT", ("L2", "s1"): "PRESENT", ("L3", "s1"): "ABSENT", ("L4", "s1"): "LATE",
        ("L1", "s2"): "PRESENT", ("L3", "s2"): "ABSENT", ("L4", "s2"): "PRESENT",
        ("L1", "s3"): "ABSENT", ("L2", "s3"): "ABSENT", ("L3", "s3"): "ABSENT", ("L4", "s3"): "ABSENT",
    }
    return SectionData("sec-1", "CSE-A-1", "CS201", "Data Structures", lectures, learners, marks)


def test_standing_counts_present_late_and_excused_but_not_flagged_or_missing():
    result = standing(["PRESENT", "LATE", "ABSENT", "EXCUSED", None, "FLAGGED"])
    assert (result.attended, result.held, result.percentage) == (3, 6, 50.0)


def test_standing_with_nothing_held_has_no_percentage():
    assert standing([]).percentage is None


def test_combine_is_total_over_total_not_an_average_of_percentages():
    # 3 of 4 (75%) and 1 of 6 (16.67%) -> 4 of 10, not (75 + 16.67) / 2
    assert combine([standing(["PRESENT"] * 3 + ["ABSENT"]), standing(["PRESENT"] + ["ABSENT"] * 5)]).percentage == 40.0


@pytest.mark.parametrize(
    "attended, held, threshold, expected",
    [(6, 10, 75.0, 6), (7, 10, 75.0, 2), (9, 10, 75.0, 0), (0, 4, 75.0, 12), (3, 4, 75.0, 0), (1, 2, 100.0, None)],
)
def test_classes_needed(attended, held, threshold, expected):
    assert classes_needed(attended, held, threshold) == expected


def test_shortage_lists_only_students_below_the_threshold_lowest_first():
    report = builders.build_shortage([make_section()], META)
    assert [(r.roll, r.attended, r.held, r.percentage, r.classes_needed) for r in report.rows] == [
        ("R3", 0, 4, 0.0, 12),
        ("R2", 1, 2, 50.0, 2),
    ]
    assert report.students_counted == 3
    assert report.average_percentage == 41.67


def test_register_marks_classes_before_joining_as_not_enrolled_and_counts_present_per_lecture():
    report = builders.build_register(make_section(), META)
    assert [lecture.present for lecture in report.lectures] == [1, 1, 0, 2]
    second = next(row for row in report.rows if row.roll == "R2")
    assert second.marks == ["NOT_ENROLLED", "NOT_ENROLLED", "ABSENT", "PRESENT"]
    assert (second.attended, second.held, second.percentage) == (1, 2, 50.0)


def test_summary_leaves_a_cell_empty_for_a_subject_the_student_is_not_in():
    other = SectionData(
        "sec-2", "CSE-A-1", "CS203", "Database Management Systems",
        [Lecture("M1", DAYS[0], "10:00", "10:55")], [Learner("s1", "Aarav Sharma", "R1", DAYS[0])], {("M1", "s1"): "PRESENT"},
    )
    report = builders.build_summary([make_section(), other], META)
    assert [subject.subject_code for subject in report.subjects] == ["CS201", "CS203"]
    row = {r.roll: r for r in report.rows}
    assert row["R2"].cells[1] is None
    assert (row["R1"].overall.attended, row["R1"].overall.held, row["R1"].overall.percentage) == (4, 5, 80.0)


def test_scope_always_filters_by_tenant_and_limits_a_teacher_to_their_own_classes():
    teacher = loader._scope("tenant-1", "teacher-1", "group-1", None)
    assert teacher == {"tenantId": "tenant-1", "faculties": {"some": {"teacherId": "teacher-1"}}, "groupId": "group-1"}
    assert loader._scope("tenant-1", None, None, None) == {"tenantId": "tenant-1"}


async def test_admin_must_choose_a_class(monkeypatch):
    monkeypatch.setattr(service, "load_sections", AsyncMock(return_value=[make_section()]))
    with pytest.raises(HTTPException) as caught:
        await service.shortage_report("tenant-1", None, ReportQuery())
    assert caught.value.status_code == 400


async def test_unknown_or_foreign_class_is_not_found(monkeypatch):
    monkeypatch.setattr(service, "load_sections", AsyncMock(return_value=[]))
    with pytest.raises(HTTPException) as caught:
        await service.shortage_report("tenant-1", "teacher-1", ReportQuery(section_id="someone-elses"))
    assert caught.value.status_code == 404


async def test_register_needs_a_subject_and_dates_must_be_in_order():
    with pytest.raises(HTTPException) as no_subject:
        await service.register_report("tenant-1", "teacher-1", ReportQuery(group_id="g"))
    assert no_subject.value.status_code == 400
    with pytest.raises(HTTPException) as backwards:
        await service.shortage_report("tenant-1", "teacher-1", ReportQuery(date_from=DAYS[3], date_to=DAYS[0]))
    assert backwards.value.status_code == 400


async def test_report_uses_the_tenant_threshold(monkeypatch):
    monkeypatch.setattr(service, "load_sections", AsyncMock(return_value=[make_section()]))
    config = SimpleNamespace(get_config=AsyncMock(return_value=SimpleNamespace(minAttendancePct=60.0)))
    monkeypatch.setattr(service, "SystemConfigService", lambda: config)
    report = await service.shortage_report("tenant-1", "teacher-1", ReportQuery(section_id="sec-1"))
    assert [r.roll for r in report.rows] == ["R3", "R2"]
    config.get_config.assert_awaited_once_with(tenant_id="tenant-1")
