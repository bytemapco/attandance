from datetime import date, datetime
from types import SimpleNamespace as NS

from app.services.student_history import build_where, effective_status, to_item

SINCE = {"sec-1": date(2026, 9, 1), "sec-2": date(2026, 10, 1)}


def record(**extra):
    base = dict(
        id="rec-1",
        status="PRESENT",
        method="QR_CODE",
        verifiedAt=datetime(2026, 11, 2, 9, 5),
        faceScore=None,
        livenessScore=None,
        remarks=None,
        studentNote=None,
    )
    return NS(**{**base, **extra})


def occurrence(records=()):
    return NS(
        id="occ-1",
        date=datetime(2026, 11, 2),
        startTime="09:00",
        endTime="10:00",
        courseSection=NS(id="sec-1", name="CE-A", subject=NS(name="Maths", code="MA101")),
        attendanceRecords=list(records),
    )


def test_a_closed_class_without_a_record_is_absent():
    item = to_item(occurrence())
    assert item.status == "ABSENT"
    assert item.attendance_id is None and item.marked_at is None and not item.can_add_note


def test_a_record_gives_its_status_method_and_time():
    item = to_item(occurrence([record()]))
    assert (item.status, item.method, item.attendance_id) == ("PRESENT", "QR_CODE", "rec-1")
    assert item.date == date(2026, 11, 2)
    assert (item.subject_code, item.class_code) == ("MA101", "CE-A")


def test_a_flagged_mark_can_take_a_student_note():
    item = to_item(occurrence([record(status="FLAGGED", remarks="Face match below threshold.")]))
    assert item.can_add_note
    assert item.remarks == "Face match below threshold."


def test_a_face_scores_stay_null_when_the_check_did_not_run():
    item = to_item(occurrence([record()]))
    assert item.face_score is None and item.liveness_score is None


def test_effective_status():
    assert effective_status(None) == "ABSENT"
    assert effective_status(record(status="LATE")) == "LATE"


def test_where_is_scoped_to_the_tenant_and_leaves_out_cancelled_classes():
    where = build_where("tenant-1", "stu-1", SINCE)
    assert where["tenantId"] == "tenant-1"
    assert where["status"] == {"not": "CANCELLED"}


def test_each_section_is_limited_to_classes_since_the_student_joined():
    where = build_where("tenant-1", "stu-1", SINCE)
    sections = where["AND"][0]["OR"]
    assert [(s["courseSectionId"], s["date"]["gte"]) for s in sections] == [
        ("sec-1", datetime(2026, 9, 1)),
        ("sec-2", datetime(2026, 10, 1)),
    ]


def test_only_classes_with_an_outcome_are_listed():
    outcome = build_where("tenant-1", "stu-1", SINCE)["AND"][1]["OR"]
    assert {"isAttendanceLocked": True, "status": "CONDUCTED"} in outcome
    assert any("attendanceRecords" in clause for clause in outcome)


def test_a_subject_filter_keeps_only_that_section():
    sections = build_where("tenant-1", "stu-1", SINCE, course_section_id="sec-2")["AND"][0]["OR"]
    assert [s["courseSectionId"] for s in sections] == ["sec-2"]


def test_a_subject_the_student_is_not_in_matches_nothing():
    assert build_where("tenant-1", "stu-1", SINCE, course_section_id="other")["AND"][0]["OR"] == []


def test_the_date_range_is_inclusive_and_optional():
    assert "date" not in build_where("tenant-1", "stu-1", SINCE)
    bounded = build_where("tenant-1", "stu-1", SINCE, start=date(2026, 11, 1), end=date(2026, 11, 30))
    assert bounded["date"] == {"gte": datetime(2026, 11, 1), "lte": datetime(2026, 11, 30)}
    assert build_where("tenant-1", "stu-1", SINCE, end=date(2026, 11, 30))["date"] == {"lte": datetime(2026, 11, 30)}


def test_a_status_filter_matches_that_students_records():
    clause = build_where("tenant-1", "stu-1", SINCE, status="LATE")["AND"][2]
    assert clause == {"attendanceRecords": {"some": {"studentId": "stu-1", "status": "LATE"}}}


def test_the_absent_filter_includes_closed_classes_with_no_other_mark():
    clause = build_where("tenant-1", "stu-1", SINCE, status="ABSENT")["AND"][2]
    assert clause["isAttendanceLocked"] is True
    assert clause["NOT"] == [{"attendanceRecords": {"some": {"studentId": "stu-1", "status": {"not": "ABSENT"}}}}]
