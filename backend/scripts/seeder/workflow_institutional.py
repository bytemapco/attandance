"""Institutional Academic Architecture Seeding Workflow (NEP/UGC Aligned)."""

from datetime import datetime, date, timedelta
from typing import Any, Dict, List
from app.core.logging_config import get_logger
from .client import APIClient

logger = get_logger("app.seeder.institutional")


async def seed_academic_year(client: APIClient) -> Dict[str, Any]:
    """Ensure an active Academic Year (Semester) exists with Saturday enabled."""
    existing = await client.get("/admin/academic-years")
    active = next((y for y in existing if y.get("status") == "ACTIVE"), None)
    if active:
        return active

    today = date.today()
    start_date = today.replace(month=1, day=1) if today.month <= 6 else today.replace(month=7, day=1)
    end_date = today.replace(month=6, day=30) if today.month <= 6 else today.replace(month=12, day=31)

    payload = {
        "name": f"Semester {'4' if today.month <= 6 else '5'} ({today.year}–{today.year + 1})",
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "attendance_start_date": (start_date + timedelta(days=5)).isoformat(),
        "attendance_end_date": (end_date - timedelta(days=15)).isoformat(),
        "saturday_enabled": True,
        "min_attendance_pct": 75.0,
        "verification_window_min": 60,
    }
    created = await client.post("/admin/academic-years", json_data=payload)
    logger.info("Created Academic Semester: %s", created["name"])
    return created


async def seed_time_slots(client: APIClient) -> List[Dict[str, Any]]:
    """Seed UGC standard daily lecture, recess, and lab block slots."""
    existing = await client.get("/admin/timeslots")
    if existing:
        return existing

    seeded = await client.post("/admin/timeslots/seed-standard")
    logger.info("Seeded %d standard UGC time slots", len(seeded))
    return seeded


async def seed_course_sections(
    client: APIClient,
    academic_year_id: str,
    subject_map: Dict[str, str],
    teacher_map: Dict[str, Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """Create Course Sections and assign primary instructors."""
    existing = await client.get(f"/timetable/sections?academic_year_id={academic_year_id}")
    section_map = {f"{s['subject_name']}-{s['name']}": s for s in existing}

    targets = [
        ("CS201", "Division A", "rajesh.kulkarni@yopmail.com"),
        ("CS202", "Division A", "sunita.deshmukh@yopmail.com"),
        ("AI301", "Division A", "anand.verma@yopmail.com"),
        ("IT302", "Division A", "priya.nambiar@yopmail.com"),
    ]

    for subj_code, sec_name, teacher_email in targets:
        subj_id = subject_map.get(subj_code)
        teacher_id = teacher_map.get(teacher_email, {}).get("id")
        key = f"{subj_code}-{sec_name}"

        if key not in section_map and subj_id and teacher_id:
            payload = {
                "academic_year_id": academic_year_id,
                "subject_id": subj_id,
                "name": sec_name,
                "primary_teacher_id": teacher_id,
            }
            sec = await client.post("/timetable/sections", json_data=payload)
            section_map[key] = sec

    logger.info("Configured %d Course Sections", len(section_map))
    return section_map


async def enroll_students_in_sections(
    client: APIClient,
    section_map: Dict[str, Dict[str, Any]],
    student_map: Dict[str, Dict[str, Any]],
) -> None:
    """Enroll department students into corresponding course sections."""
    cse_ids = [s["id"] for _, s in student_map.items() if s.get("branch") == "CSE" or "BCSE" in s.get("enrollment_number", "")]
    aids_ids = [s["id"] for _, s in student_map.items() if s.get("branch") == "AIDS" or "BAID" in s.get("enrollment_number", "")]
    it_ids = [s["id"] for _, s in student_map.items() if s.get("branch") == "IT" or "BIT" in s.get("enrollment_number", "")]

    plans = [
        ("CS201-Division A", cse_ids),
        ("CS202-Division A", cse_ids),
        ("AI301-Division A", aids_ids),
        ("IT302-Division A", it_ids),
    ]

    for sec_key, sids in plans:
        sec = section_map.get(sec_key)
        if sec and sids:
            try:
                await client.post(
                    "/timetable/sections/enroll-bulk",
                    json_data={"course_section_id": sec["id"], "student_ids": sids},
                )
            except Exception as ex:
                logger.warning("Section enrollment notice: %s", ex)


async def seed_timetable_and_occurrences(
    client: APIClient,
    academic_year: Dict[str, Any],
    section_map: Dict[str, Dict[str, Any]],
    time_slots: List[Dict[str, Any]],
    room_map: Dict[str, str],
    teacher_map: Dict[str, Dict[str, Any]],
) -> None:
    """Seed weekly schedule rules (including today's day) and activate occurrences."""
    lecture_slots = [s for s in time_slots if not s.get("is_break")]
    if not lecture_slots:
        return

    today_dow = datetime.now().isoweekday()  # 1=Mon .. 7=Sun
    # Map each section to a day and slot
    slot_assignments = [
        ("CS201-Division A", 1, lecture_slots[0]["id"], room_map.get("Aryabhata Lecture Theatre 101"), teacher_map.get("rajesh.kulkarni@yopmail.com", {}).get("id")),
        ("CS202-Division A", 1, lecture_slots[1]["id"], room_map.get("Turing Computing Lab 301"), teacher_map.get("sunita.deshmukh@yopmail.com", {}).get("id")),
        ("AI301-Division A", 2, lecture_slots[0]["id"], room_map.get("Kalam Advanced AI Lab 405"), teacher_map.get("anand.verma@yopmail.com", {}).get("id")),
        ("IT302-Division A", 3, lecture_slots[0]["id"], room_map.get("CV Raman Seminar Hall 202"), teacher_map.get("priya.nambiar@yopmail.com", {}).get("id")),
    ]

    # Ensure there is always a class for TODAY so teacher /today view has live scheduled sessions!
    if today_dow <= 6:
        slot_assignments.append(
            ("CS201-Division A", today_dow, lecture_slots[0]["id"], room_map.get("Aryabhata Lecture Theatre 101"), teacher_map.get("rajesh.kulkarni@yopmail.com", {}).get("id"))
        )

    for sec_key, dow, slot_id, room_id, teach_id in slot_assignments:
        sec = section_map.get(sec_key)
        if not sec:
            continue
        try:
            await client.post(
                "/timetable/rules",
                json_data={
                    "course_section_id": sec["id"],
                    "time_slot_id": slot_id,
                    "classroom_id": room_id,
                    "teacher_id": teach_id,
                    "day_of_week": dow,
                    "effective_from": academic_year["start_date"],
                    "effective_until": academic_year["end_date"],
                },
            )
        except Exception as ex:
            logger.debug("Rule seeding notice: %s", ex)

    # Activate Academic Year to trigger rolling 7-day occurrence generation
    try:
        await client.post(f"/admin/academic-years/{academic_year['id']}/activate")
        logger.info("Activated Academic Year and generated rolling occurrences.")
    except Exception as ex:
        logger.warning("Academic Year activation notice: %s", ex)
