from datetime import date

from app.services.gamification_service import _streaks
from app.services.student_class_ledger import HeldClass


def classes(*statuses):
    """Newest first, one class per day."""
    return [HeldClass(date(2026, 11, 20 - i), status) for i, status in enumerate(statuses)]


def test_consecutive_attended_classes_build_the_streak():
    assert _streaks(classes("PRESENT", "PRESENT", "PRESENT"), [], 0) == (3, 3)


def test_late_and_approved_marks_count_as_attended():
    assert _streaks(classes("LATE", "APPROVED", "PRESENT"), [], 0) == (3, 3)


def test_an_absence_ends_the_current_streak_but_keeps_the_best_one():
    # newest first: P, A, P, P  -> now 1, best earlier run was 2
    assert _streaks(classes("PRESENT", "ABSENT", "PRESENT", "PRESENT"), [], 0) == (1, 2)


def test_a_class_with_no_record_counts_as_a_break():
    assert _streaks(classes("PRESENT", None, "PRESENT"), [], 0) == (1, 1)


def test_flagged_and_excused_classes_neither_add_nor_break():
    assert _streaks(classes("PRESENT", "FLAGGED", "EXCUSED", "PRESENT"), [], 0) == (2, 2)


def test_approved_leave_days_are_skipped_even_without_a_record():
    leave = [(date(2026, 11, 19), date(2026, 11, 19))]
    assert _streaks(classes("PRESENT", None, "PRESENT"), leave, 0) == (2, 2)


def test_the_best_streak_is_never_lowered():
    assert _streaks(classes("PRESENT", "PRESENT"), [], 5) == (2, 5)


def test_no_classes_yet_is_zero():
    assert _streaks([], [], 0) == (0, 0)
