import pytest

from app.services.attendance_percentage import attendance_percentage


def test_hand_computed_percentage() -> None:
    # 10 conducted: 6 present + 1 late + 1 approved-after-flag = 8 attended; 1 absent, 1 flagged (not yet reviewed)
    statuses = ["PRESENT"] * 6 + ["LATE", "APPROVED", "ABSENT", "FLAGGED"]
    assert attendance_percentage(statuses, conducted=10) == 80.0


def test_excused_counts_by_default_and_can_be_excluded() -> None:
    statuses = ["PRESENT"] * 3 + ["EXCUSED"]
    assert attendance_percentage(statuses, conducted=4) == 100.0
    assert attendance_percentage(statuses, conducted=4, excused_counts_as_present=False) == 75.0


def test_missing_records_count_against_the_student() -> None:
    assert attendance_percentage(["PRESENT"], conducted=4) == 25.0


def test_rounds_to_two_decimals() -> None:
    assert attendance_percentage(["PRESENT"], conducted=3) == 33.33


@pytest.mark.parametrize("conducted", [0, -1])
def test_nothing_conducted_is_none_not_zero(conducted: int) -> None:
    assert attendance_percentage([], conducted=conducted) is None
