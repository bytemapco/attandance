from app.services.attendance_percentage import attendance_percentage


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
