from datetime import date
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.services.agent.tools import common, report_tools
from app.services.agent.tools.report_tools import ScopeArgs, TrendArgs
from app.services.agent.types import ADMIN, TEACHER, Principal


def who(role=TEACHER):
    teacher = SimpleNamespace(id="teacher-1") if role == TEACHER else None
    return Principal(user=SimpleNamespace(id="u"), role=role, tenant_id="tenant-1", teacher=teacher)


def cell(attended, held):
    return SimpleNamespace(attended=attended, held=held, percentage=common.pct(attended, held))


def row(student, attended, held):
    return SimpleNamespace(student_id=student, student_name=student.title(), roll=f"R-{student}", overall=cell(attended, held))


def summary(*rows):
    return SimpleNamespace(rows=list(rows))


def filters(*codes, threshold=75.0):
    return SimpleNamespace(threshold=threshold, classes=[SimpleNamespace(id=f"g-{c}", code=c) for c in codes])


@pytest.fixture
def parts(monkeypatch):
    fake = SimpleNamespace(summary=AsyncMock(), shortage=AsyncMock(), filters=AsyncMock(return_value=filters("CE-A")))
    monkeypatch.setattr(report_tools.service, "summary_report", fake.summary)
    monkeypatch.setattr(report_tools.service, "shortage_report", fake.shortage)
    monkeypatch.setattr(report_tools, "load_filters", fake.filters)
    return fake


def replies(parts, overall, recent):
    """The all-time report first, then the recent one, for each class."""
    parts.summary.side_effect = [summary(*overall), summary(*recent)] * 40


class TestHelpers:
    def test_a_percentage_is_rounded_and_none_when_nothing_was_held(self):
        assert common.pct(1, 3) == 33.3 and common.pct(0, 0) is None

    def test_a_recent_window_ends_on_the_chosen_day_and_covers_the_days_asked(self):
        first, last = common.recent_window(14, back=14)
        assert (last - first).days == 13 and (common.get_ist_today() - last).days == 14

    def test_the_model_gets_a_bounded_slice_and_is_told_when_there_is_more(self):
        shown = common.capped(list(range(common.MODEL_ROWS + 5)))
        assert len(shown["rows"]) == common.MODEL_ROWS and shown["truncated"] and shown["total"] == common.MODEL_ROWS + 5

    def test_a_teacher_is_scoped_to_their_id_and_an_admin_to_none(self):
        assert common.teacher_id_of(who(TEACHER)) == "teacher-1" and common.teacher_id_of(who(ADMIN)) is None

    def test_a_download_link_carries_only_the_filters_given(self):
        link = report_tools._download("shortage", ScopeArgs(class_id="g1", date_from=date(2026, 11, 1)))
        assert link == "/reports/shortage/export?class_id=g1&date_from=2026-11-01&format=xlsx"


class TestAtRisk:
    async def test_a_student_below_the_minimum_is_listed_first(self, parts):
        replies(parts, [row("ravi", 1, 4), row("asha", 4, 4)], [])
        told = (await report_tools.at_risk_students(who(), ScopeArgs())).data
        assert [r["name"] for r in told["at_risk"]["rows"]] == ["Ravi"]
        assert told["at_risk"]["rows"][0]["reason"] == "below minimum"

    async def test_a_fall_of_fifteen_points_in_two_weeks_is_flagged_even_above_the_minimum(self, parts):
        replies(parts, [row("meera", 8, 10)], [row("meera", 2, 4)])  # 80% overall, 50% lately
        [flagged] = (await report_tools.at_risk_students(who(), ScopeArgs())).data["at_risk"]["rows"]
        assert flagged["name"] == "Meera" and flagged["recent_percentage"] == 50.0 and "dropped" in flagged["reason"]

    async def test_too_few_recent_classes_are_not_read_as_a_fall(self, parts):
        replies(parts, [row("meera", 8, 10)], [row("meera", 0, 2)])
        assert (await report_tools.at_risk_students(who(), ScopeArgs())).data["at_risk"]["total"] == 0

    async def test_a_student_with_no_classes_held_is_skipped(self, parts):
        replies(parts, [row("new", 0, 0)], [])
        assert (await report_tools.at_risk_students(who(), ScopeArgs())).data["at_risk"]["total"] == 0

    async def test_a_class_with_no_recent_lectures_is_not_an_error(self, parts):
        parts.summary.side_effect = [summary(row("ravi", 1, 4)), HTTPException(404, "No matching class found.")]
        assert (await report_tools.at_risk_students(who(), ScopeArgs())).data["at_risk"]["total"] == 1

    async def test_any_other_error_is_passed_on(self, parts):
        parts.summary.side_effect = HTTPException(400, "Choose a class first.")
        with pytest.raises(HTTPException):
            await report_tools.at_risk_students(who(), ScopeArgs())

    async def test_a_named_class_is_the_only_one_checked_and_an_unnamed_search_is_capped(self, parts):
        replies(parts, [], [])
        parts.filters.return_value = filters(*[f"C{i}" for i in range(report_tools.CLASS_CAP + 5)])
        assert (await report_tools.at_risk_students(who(), ScopeArgs())).data["classes_checked"] == report_tools.CLASS_CAP
        assert (await report_tools.at_risk_students(who(), ScopeArgs(class_id="g-CE-A"))).data["classes_checked"] == 1


class TestShortageAndEligibility:
    def report(self):
        shortage_row = SimpleNamespace(student_id="s1", student_name="Ravi", roll="R1", class_code="CE-A",
                                       attended=1, held=4, percentage=25.0, classes_needed=8)
        meta = SimpleNamespace(scope="CE-A", threshold=75.0)
        return SimpleNamespace(meta=meta, students_counted=2, average_percentage=62.5, rows=[shortage_row])

    async def test_it_reports_each_student_with_what_they_need_and_a_download(self, parts):
        parts.shortage.return_value = self.report()
        result = await report_tools.students_below_minimum(who(), ScopeArgs(class_id="g1"))
        assert result.data["below_minimum"]["rows"][0]["classes_needed"] == 8
        assert result.ui[0]["download"].startswith("/reports/shortage/export")

    async def test_a_teachers_report_is_scoped_to_them_and_an_admins_is_not(self, parts):
        parts.shortage.return_value = self.report()
        await report_tools.students_below_minimum(who(TEACHER), ScopeArgs())
        await report_tools.students_below_minimum(who(ADMIN), ScopeArgs(class_id="g1"))
        assert [c.args[1] for c in parts.shortage.call_args_list] == ["teacher-1", None]

    async def test_eligibility_lists_but_leaves_condonation_to_the_institution(self, parts):
        parts.shortage.return_value = self.report()
        result = await report_tools.exam_eligibility(who(ADMIN), ScopeArgs(class_id="g1"))
        assert "Condonation is decided by the institution" in result.data["note"]
        assert result.ui[-1]["path"] == "/admin/reports"


class TestTrend:
    async def test_the_worst_drop_comes_first_and_classes_without_data_are_left_out(self, parts, monkeypatch):
        parts.filters.return_value = filters("A", "B", "C")
        by_class = {"g-A": [80.0, 78.0], "g-B": [60.0, 85.0], "g-C": [None, 70.0]}  # now, before

        async def averages(principal, class_id, window):
            return by_class[class_id].pop(0)

        monkeypatch.setattr(report_tools, "_class_average", averages)

        told = (await report_tools.attendance_trend(who(ADMIN), TrendArgs(days=30))).data

        assert [(c["class"], c["change"]) for c in told["classes"]["rows"]] == [("B", -25.0), ("A", 2.0)]
