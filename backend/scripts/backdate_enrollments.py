#!/usr/bin/env python3
"""Demo data only: move each enrolment of one institution back to its section's first class day.

The API stamps an enrolment with the day it is created and cannot backdate it, and the reports only count classes
from that day. After `seed.py` has registered past weeks of classes, this makes those weeks count, as they would
for students who had really been enrolled since the start of term.

It changes only the institution named by the slug, so it is safe to run wherever the demo institution exists.

Usage: python scripts/backdate_enrollments.py vidyasagar-pune
"""
import asyncio
import sys
from pathlib import Path

backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(backend_root / ".env")

BACKDATE = """
UPDATE course_enrollments AS e
SET enrolled_at = first_class.day
FROM (
    SELECT course_section_id, MIN(date) AS day FROM class_occurrences GROUP BY course_section_id
) AS first_class
WHERE e.course_section_id = first_class.course_section_id
  AND e.enrolled_at::date > first_class.day
  AND e.course_section_id IN (
      SELECT s.id FROM course_sections AS s JOIN tenants AS t ON t.id = s.tenant_id WHERE t.slug = $1
  )
"""


async def run(slug: str) -> int:
    from app.db.client import connect_db, db, disconnect_db

    await connect_db()
    try:
        return await db.execute_raw(BACKDATE, slug)
    finally:
        await disconnect_db()


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        sys.stderr.write("usage: backdate_enrollments.py <institution-slug>\n")
        return 2
    sys.stdout.write(f"Backdated {asyncio.run(run(argv[1]))} enrolments in {argv[1]}.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
