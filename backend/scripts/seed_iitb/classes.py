"""Batches, classes, students, subjects with their teachers, class enrolments and the weekly timetable."""

from datetime import datetime, timezone

from app.db.client import db

from . import data

SEMESTER = 5  # the 2024 entry batch is in its third year in Autumn 2026
ROLL_PREFIX = {code: roll for code, _, roll in data.DEPARTMENTS}


def _naive(day: tuple) -> datetime:
    return datetime(*day)


async def _students(tenant_id: str, dept, batch, group, hashed: str) -> list:
    students = []
    for index, (first, last, gender) in enumerate(data.STUDENTS[dept.code], start=1):
        user = await db.user.create(
            data={
                "tenantId": tenant_id,
                "email": f"{first.lower()}{index:02d}@yopmail.com",
                "hashedPassword": hashed,
                "role": "STUDENT",
                "isActive": True,
            }
        )
        student = await db.student.create(
            data={
                "tenantId": tenant_id,
                "userId": user.id,
                "departmentId": dept.id,
                "batchId": batch.id,
                "batch": batch.code,
                "semester": SEMESTER,
                "enrollmentNumber": f"24B{ROLL_PREFIX[dept.code]}{index:02d}",
                "firstName": first,
                "lastName": last,
                "gender": gender,
                "dateOfBirth": datetime(2005 + index % 2, 1 + index % 12, 3 + index),
                "phone": f"97300{20000 + index * 53 + len(dept.code) * 700:05d}",
            }
        )
        await db.classmember.create(data={"tenantId": tenant_id, "groupId": group.id, "studentId": student.id})
        students.append((student, user, data.PROPENSITY[index - 1]))
    return students


def _end_time(start: str) -> str:
    return f"{int(start[:2]) + 1:02d}:00"


async def _timetable(tenant_id: str, dept_code: str, section, teacher, room, position: int) -> None:
    first_period, second_period = data.CLASS_PERIODS[dept_code]
    slots = [(position + 1, data.PERIODS[first_period]), ((position + 2) % 5 + 1, data.PERIODS[second_period])]
    for day, start in slots:
        await db.timetablerule.create(
            data={
                "tenantId": tenant_id,
                "courseSectionId": section.id,
                "classroomId": room.id,
                "teacherId": teacher.id,
                "dayOfWeek": day,
                "startTime": start,
                "endTime": _end_time(start),
                "effectiveFrom": _naive(data.SEMESTER_START),
            }
        )


async def _sections(tenant_id: str, refs: dict, dept, group, students: list) -> list:
    subject_codes = [code for code, _ in data.SUBJECTS[dept.code]]
    teachers = list(refs["teachers"][dept.code])
    if dept.code in ("CSE", "EE"):
        subject_codes.append(data.SHARED_SUBJECT[0])
        teachers.append(refs["teachers"]["MA"][0])
    room = refs["rooms"][data.DEPT_ROOM[dept.code]]
    enrolled_at = datetime(*data.SEMESTER_START, tzinfo=timezone.utc)
    sections = []
    for position, (code, teacher) in enumerate(zip(subject_codes, teachers)):
        section = await db.coursesection.create(
            data={
                "tenantId": tenant_id,
                "subjectId": refs["subjects"][code].id,
                "departmentId": dept.id,
                "name": group.batch,
                "defaultRoomId": room.id,
                "groupId": group.id,
            }
        )
        await db.coursefaculty.create(
            data={
                "courseSectionId": section.id,
                "teacherId": teacher.id,
                "isPrimary": True,
                "roleDescription": "Primary Instructor",
            }
        )
        for student, _, _ in students:
            await db.courseenrollment.create(
                data={
                    "courseSectionId": section.id,
                    "studentId": student.id,
                    "source": "CLASS",
                    "enrolledAt": enrolled_at,
                }
            )
        await _timetable(tenant_id, dept.code, section, teacher, room, position)
        sections.append((section, teacher))
    return sections


async def create_classes(refs: dict, hashed: str) -> list:
    tenant_id = refs["tenant"].id
    classes = []
    for code in data.STUDENTS:
        dept = refs["departments"][code]
        batch = await db.batch.create(
            data={"tenantId": tenant_id, "departmentId": dept.id, "section": "A", "number": 1, "code": f"{code}-A-1"}
        )
        group = await db.studentgroup.create(
            data={
                "tenantId": tenant_id,
                "departmentId": dept.id,
                "batch": batch.code,
                "batchId": batch.id,
                "semester": SEMESTER,
            }
        )
        students = await _students(tenant_id, dept, batch, group, hashed)
        sections = await _sections(tenant_id, refs, dept, group, students)
        classes.append({"dept": code, "group": group, "students": students, "sections": sections})
    return classes
