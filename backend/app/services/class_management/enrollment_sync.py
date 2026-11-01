from datetime import datetime, timezone
from typing import List
from app.db.client import db


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def enroll_students(section_ids: List[str], student_ids: List[str], source: str = "CLASS") -> int:
    enrolled = 0
    for section_id in section_ids:
        for student_id in student_ids:
            key = {"courseSectionId_studentId": {"courseSectionId": section_id, "studentId": student_id}}
            existing = await db.courseenrollment.find_unique(where=key)
            if existing and existing.endedAt is None:
                continue
            if existing:
                await db.courseenrollment.update(
                    where=key,
                    data={"endedAt": None, "status": "ACTIVE", "source": source, "enrolledAt": _now()},
                )
            else:
                await db.courseenrollment.create(
                    data={
                        "courseSectionId": section_id,
                        "studentId": student_id,
                        "status": "ACTIVE",
                        "source": source,
                    }
                )
            enrolled += 1
    return enrolled


async def end_class_enrollments(section_ids: List[str], student_ids: List[str]) -> None:
    if not section_ids or not student_ids:
        return
    await db.courseenrollment.update_many(
        where={
            "courseSectionId": {"in": section_ids},
            "studentId": {"in": student_ids},
            "source": "CLASS",
            "endedAt": None,
        },
        data={"endedAt": _now(), "status": "DROPPED"},
    )


def all_section_ids(group) -> List[str]:
    return [s.id for s in group.courseSections or []]
