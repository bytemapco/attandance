#!/usr/bin/env python3
"""Demo data only (local development): move each enrolment back to the section's first class day.

The API stamps an enrolment with the day it is created and cannot backdate it, and the reports only count classes
from that day. After `seed.py` has registered past weeks of classes, this makes those weeks count, as they would
for students who had really been enrolled since the start of term. Uses the same local-only guards as the wipe.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from reset_database import parse_and_validate_database_target, verify_execution_environment  # noqa: E402

BACKDATE = """
UPDATE course_enrollments AS e
SET enrolled_at = first_class.day
FROM (
    SELECT course_section_id, MIN(date) AS day FROM class_occurrences GROUP BY course_section_id
) AS first_class
WHERE e.course_section_id = first_class.course_section_id AND e.enrolled_at::date > first_class.day
"""


async def run() -> int:
    from app.db.client import connect_db, db, disconnect_db

    await connect_db()
    try:
        return await db.execute_raw(BACKDATE)
    finally:
        await disconnect_db()


def main() -> None:
    verify_execution_environment()
    host, name = parse_and_validate_database_target()
    moved = asyncio.run(run())
    sys.stdout.write(f"Backdated {moved} enrolments in {host}/{name}.\n")


if __name__ == "__main__":
    main()
