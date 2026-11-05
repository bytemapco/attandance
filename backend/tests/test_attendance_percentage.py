from app.services.attendance_percentage import attendance_margin, attendance_percentage


def test_counts_present_late_and_excused():
    statuses = ["PRESENT"] * 6 + ["LATE"] * 2 + ["EXCUSED"] + ["ABSENT"]
    # (6 + 2 + 1) / 10 classes held
    assert attendance_percentage(statuses, conducted=10) == 90.0


def test_excused_can_be_left_out_of_the_numerator():
    statuses = ["PRESENT"] * 6 + ["LATE"] * 2 + ["EXCUSED"] + ["ABSENT"]
    # (6 + 2) / 10 classes held
    assert attendance_percentage(statuses, conducted=10, excused_counts_as_present=False) == 80.0


def test_rounds_to_two_places():
    # 7 / 9 = 77.777...
    assert attendance_percentage(["PRESENT"] * 7 + ["ABSENT"] * 2, conducted=9) == 77.78


def test_flagged_is_not_attendance_until_a_teacher_approves_it():
    assert attendance_percentage(["PRESENT"] * 5 + ["FLAGGED"] * 3, conducted=8) == 62.5
    assert attendance_percentage(["PRESENT"] * 5 + ["APPROVED"] * 3, conducted=8) == 100.0


def test_a_class_with_no_marks_for_the_student_counts_against_them():
    # Held 10 classes, the student has 4 records: the 6 missing ones are not attendance.
    assert attendance_percentage(["PRESENT"] * 4, conducted=10) == 40.0


def test_nothing_held_yet_is_none_not_zero_or_hundred():
    assert attendance_percentage([], conducted=0) is None
    assert attendance_percentage(["PRESENT"], conducted=0) is None


def test_margin_counts_the_classes_a_student_can_still_miss():
    # 18 of 20 = 90%. Missing 3 more: 18/23 = 78.3% (ok). Missing 4: 18/24 = 75.0% (ok). Missing 5: 18/25 = 72%.
    assert attendance_margin(18, 20, 75.0) == (4, 0)


def test_margin_is_zero_when_sitting_exactly_on_the_line():
    # 15 of 20 = 75%: one more absence drops to 15/21 = 71.4%.
    assert attendance_margin(15, 20, 75.0) == (0, 0)


def test_margin_counts_the_classes_needed_to_recover():
    # 12 of 20 = 60%. Attending 12 in a row: 24/32 = 75% exactly. Attending 11: 23/31 = 74.2%.
    assert attendance_margin(12, 20, 75.0) == (0, 12)


def test_margin_rounds_the_recovery_run_up():
    # 7 of 10 = 70%. Attending 2: 9/12 = 75% exactly.
    assert attendance_margin(7, 10, 75.0) == (0, 2)
    # 6 of 10 = 60%. Needs (7.5 - 6) / 0.25 = 6 classes: 12/16 = 75%.
    assert attendance_margin(6, 10, 75.0) == (0, 6)
    # 5 of 9 = 55.6%. Needs (6.75 - 5) / 0.25 = 7 classes: 12/16 = 75%.
    assert attendance_margin(5, 9, 75.0) == (0, 7)


def test_margin_is_zero_before_any_class_is_held():
    assert attendance_margin(0, 0, 75.0) == (0, 0)


def test_margin_is_unreachable_at_a_hundred_percent_after_a_miss():
    assert attendance_margin(9, 10, 100.0) == (0, 0)
