from datetime import date

from app.services.student_analytics import figures, standing, weekly_trend
from app.services.student_class_ledger import HeldClass

TODAY = date(2026, 11, 5)  # Thursday; its week starts Monday 2 Nov


def test_standing_follows_the_threshold_and_the_five_point_margin():
    assert standing(None, 75.0) == "NO_DATA"
    assert standing(74.99, 75.0) == "SHORTAGE"
    assert standing(75.0, 75.0) == "AT_RISK"
    assert standing(79.99, 75.0) == "AT_RISK"
    assert standing(80.0, 75.0) == "OK"


def test_figures_for_a_student_above_the_line():
    result = figures(attended=18, conducted=20, threshold=75.0)
    # 18 / 20 = 90%. They can miss 4 more: 18 / 24 = 75%.
    assert (result.percentage, result.can_miss, result.must_attend, result.standing) == (90.0, 4, 0, "OK")


def test_figures_for_a_student_in_shortage():
    result = figures(attended=12, conducted=20, threshold=75.0)
    # 12 / 20 = 60%. They need 12 in a row: 24 / 32 = 75%.
    assert (result.percentage, result.can_miss, result.must_attend, result.standing) == (60.0, 0, 12, "SHORTAGE")


def test_figures_before_any_class_have_no_percentage():
    result = figures(attended=0, conducted=0, threshold=75.0)
    assert result.percentage is None and result.standing == "NO_DATA"
    assert (result.can_miss, result.must_attend) == (0, 0)


def test_the_trend_covers_eight_weeks_ending_this_week():
    trend = weekly_trend([], TODAY)
    assert len(trend) == 8
    assert trend[-1].week_start == date(2026, 11, 2)
    assert trend[0].week_start == date(2026, 9, 14)
    assert all(week.percentage is None for week in trend)


def test_the_trend_groups_classes_by_week_with_the_same_attendance_rule():
    classes = [
        HeldClass(date(2026, 11, 5), "PRESENT"),
        HeldClass(date(2026, 11, 3), "ABSENT"),
        HeldClass(date(2026, 11, 2), "EXCUSED"),  # counts as present, as in the subject percentage
        HeldClass(date(2026, 10, 30), "LATE"),
        HeldClass(date(2026, 10, 29), None),  # closed with no record: absent
        HeldClass(date(2026, 10, 28), "FLAGGED"),  # not attendance until a teacher approves it
    ]
    by_week = {week.week_start: week for week in weekly_trend(classes, TODAY)}
    this_week = by_week[date(2026, 11, 2)]
    assert (this_week.conducted, this_week.attended, this_week.percentage) == (3, 2, 66.67)
    last_week = by_week[date(2026, 10, 26)]
    assert (last_week.conducted, last_week.attended, last_week.percentage) == (3, 1, 33.33)


def test_classes_older_than_the_window_are_left_out():
    old = HeldClass(date(2026, 8, 1), "PRESENT")
    assert all(week.conducted == 0 for week in weekly_trend([old], TODAY))
