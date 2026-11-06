from dataclasses import dataclass
from datetime import date, datetime
from typing import Dict, List, Optional, Set
from fastapi import HTTPException, status
from prisma.models import User
from app.db.client import db
from app.schemas.timetable import AttendanceRegisterItem
from app.services.occurrence_closer import refresh_streaks
from app.services.occurrence_generator import OccurrenceGenerator


def _to_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0)


async def authorize_register_access(occurrence, user: User) -> None:
    """Teachers may only open the register of a class they take or substitute; admins are tenant-scoped upstream."""
    if user.role != "TEACHER":
        return
    teacher = await db.teacher.find_first(where={"userId": user.id, "tenantId": occurrence.tenantId})
    if not teacher or teacher.id not in (occurrence.facultyId, occurrence.substituteFacultyId):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this class.")


# A teacher's schedule can span at most this many days in one request.
MAX_SCHEDULE_RANGE_DAYS = 31


@dataclass(frozen=True)
class DailySchedule:
    """A teacher's classes with the two headcounts the schedule shows, counted by the database."""

    occurrences: list
    present_counts: Dict[str, int]
    enrolled_counts: Dict[str, int]


async def _present_counts(occurrence_ids: List[str]) -> Dict[str, int]:
    if not occurrence_ids:
        return {}
    rows = await db.attendancerecord.group_by(
        by=["occurrenceId"], count=True, where={"occurrenceId": {"in": occurrence_ids}, "status": "PRESENT"}
    )
    return {row["occurrenceId"]: row["_count"]["_all"] for row in rows}


async def _enrolled_counts(section_ids: Set[str]) -> Dict[str, int]:
    if not section_ids:
        return {}
    rows = await db.courseenrollment.group_by(
        by=["courseSectionId"], count=True, where={"courseSectionId": {"in": list(section_ids)}}
    )
    return {row["courseSectionId"]: row["_count"]["_all"] for row in rows}


def validate_schedule_range(start: date, end: date) -> None:
    if end < start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_date must be on or after the start date.")
    if (end - start).days >= MAX_SCHEDULE_RANGE_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Choose at most {MAX_SCHEDULE_RANGE_DAYS} days at a time.",
        )


class OccurrenceRegisterService:
    @staticmethod
    async def get_daily_schedule(tenant_id: str, faculty_id: str, target_date: date, end_date: Optional[date] = None):
        last_date = end_date or target_date
        validate_schedule_range(target_date, last_date)
        await OccurrenceGenerator.generate(tenant_id, target_date, last_date)
        occurrences = await db.classoccurrence.find_many(
            where={
                "tenantId": tenant_id,
                "date": {"gte": _to_dt(target_date), "lte": _to_dt(last_date)},
                "OR": [{"facultyId": faculty_id}, {"substituteFacultyId": faculty_id}],
            },
            include={"courseSection": {"include": {"subject": True}}, "classroom": True, "faculty": True},
            order=[{"date": "asc"}, {"startTime": "asc"}],
        )
        return DailySchedule(
            occurrences=occurrences,
            present_counts=await _present_counts([o.id for o in occurrences]),
            enrolled_counts=await _enrolled_counts({o.courseSectionId for o in occurrences}),
        )

    @staticmethod
    async def get_occurrence_register(tenant_id: str, occurrence_id: str, user: User):
        occurrence = await db.classoccurrence.find_first(
            where={"id": occurrence_id, "tenantId": tenant_id},
            include={
                "courseSection": {
                    "include": {
                        "subject": True,
                        "enrollments": {"include": {"student": {"include": {"user": True}}}},
                    }
                },
                "classroom": True,
                "attendanceRecords": True,
            },
        )
        if not occurrence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found")
        await authorize_register_access(occurrence, user)

        records_by_student = {r.studentId: r for r in occurrence.attendanceRecords}
        students_payload = []
        for enrollment in occurrence.courseSection.enrollments:
            student = enrollment.student
            existing_rec = records_by_student.get(student.id)
            first = getattr(student, "firstName", None)
            last = getattr(student, "lastName", None)
            if isinstance(first, str) or isinstance(last, str):
                student_name = f"{first or ''} {last or ''}".strip()
            elif hasattr(student, "user") and isinstance(getattr(student.user, "name", None), str):
                student_name = student.user.name
            else:
                student_name = "Student"
            flagged = bool(existing_rec and existing_rec.status == "FLAGGED")
            students_payload.append({
                "record_id": existing_rec.id if existing_rec else None,
                "student_id": student.id,
                "student_name": student_name,
                "enrollment_number": student.enrollmentNumber,
                "status": existing_rec.status if existing_rec else "ABSENT",
                "method": existing_rec.method if existing_rec else "MANUAL_REGISTER",
                "face_score": existing_rec.faceScore if existing_rec else None,
                "liveness_score": existing_rec.livenessScore if existing_rec else None,
                "evidence_photo_url": existing_rec.evidencePhotoUrl if existing_rec else None,
                "remarks": existing_rec.remarks if existing_rec else None,
                # The student's explanation is only needed while the teacher decides on a flagged mark.
                "student_note": existing_rec.studentNote if flagged else None,
                "verified_at": existing_rec.verifiedAt if existing_rec else None,
            })
        return {
            "occurrence_id": occurrence.id,
            "date": occurrence.date,
            "status": occurrence.status,
            "is_attendance_locked": occurrence.isAttendanceLocked,
            "verification_active": occurrence.verificationActive,
            "verification_expires": occurrence.verificationExpires,
            "class_code": occurrence.courseSection.name,
            "classroom_name": occurrence.classroom.name if occurrence.classroom else None,
            "course_name": occurrence.courseSection.subject.name if occurrence.courseSection.subject else "Class",
            "section_name": occurrence.courseSection.name,
            "time_range": f"{occurrence.startTime} - {occurrence.endTime}",
            "students": students_payload,
        }

    @staticmethod
    async def update_register_bulk(
        tenant_id: str,
        user: User,
        occurrence_id: str,
        updates: List[AttendanceRegisterItem],
        reason: Optional[str] = None,
    ):
        user_id = user.id
        occurrence = await db.classoccurrence.find_first(
            where={"id": occurrence_id, "tenantId": tenant_id}
        )
        if not occurrence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found")
        await authorize_register_access(occurrence, user)
        if occurrence.isAttendanceLocked and not (reason and reason.strip()):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This register is locked. Give a reason to change it; the change is kept in the audit log.",
            )

        student_ids = {item.student_id for item in updates}
        enrolled = await db.courseenrollment.find_many(
            where={"courseSectionId": occurrence.courseSectionId, "studentId": {"in": list(student_ids)}}
        )
        unknown = student_ids - {e.studentId for e in enrolled}
        if unknown:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{len(unknown)} student(s) are not enrolled in this class.",
            )

        updated_count = 0
        for item in updates:
            existing = await db.attendancerecord.find_unique(
                where={"occurrenceId_studentId": {"occurrenceId": occurrence_id, "studentId": item.student_id}}
            )
            if existing:
                if existing.status != item.status or existing.remarks != item.remarks:
                    await db.attendanceauditlog.create(
                        data={
                            "attendanceRecordId": existing.id,
                            "previousStatus": existing.status,
                            "newStatus": item.status,
                            "changedById": user_id,
                            "reason": reason or "Updated via register",
                        }
                    )
                    await db.attendancerecord.update(
                        where={"id": existing.id},
                        data={
                            "status": item.status,
                            "method": "MANUAL_REGISTER",
                            "remarks": item.remarks,
                            "verifiedAt": datetime.now(),
                        },
                    )
                    updated_count += 1
            else:
                new_rec = await db.attendancerecord.create(
                    data={
                        "tenantId": tenant_id,
                        "occurrenceId": occurrence_id,
                        "studentId": item.student_id,
                        "status": item.status,
                        "method": "MANUAL_REGISTER",
                        "remarks": item.remarks,
                        "verifiedAt": datetime.now(),
                    }
                )
                await db.attendanceauditlog.create(
                    data={
                        "attendanceRecordId": new_rec.id,
                        "previousStatus": "ABSENT",
                        "newStatus": item.status,
                        "changedById": user_id,
                        "reason": reason or "Initial register submission",
                    }
                )
                updated_count += 1

        if occurrence.isAttendanceLocked:
            await refresh_streaks(student_ids)
        else:
            await db.classoccurrence.update(
                where={"id": occurrence_id},
                data={"status": "CONDUCTED", "conductedAt": datetime.now()},
            )
        return {"success": True, "occurrence_id": occurrence_id, "records_processed": updated_count}
