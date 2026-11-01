from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from prisma.models import User
from app.db.client import db
from app.schemas.timetable import AttendanceRegisterItem
from app.services.occurrence_generator import OccurrenceGenerator


def _to_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0)


async def _authorize_register_access(occurrence, user: User) -> None:
    """Teachers may only open the register of a class they take or substitute; admins are tenant-scoped upstream."""
    if user.role != "TEACHER":
        return
    teacher = await db.teacher.find_first(where={"userId": user.id, "tenantId": occurrence.tenantId})
    if not teacher or teacher.id not in (occurrence.facultyId, occurrence.substituteFacultyId):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not assigned to this class.")


# A teacher's schedule can span at most this many days in one request.
MAX_SCHEDULE_RANGE_DAYS = 31


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
        for offset in range((last_date - target_date).days + 1):
            await OccurrenceGenerator.generate_occurrences_for_date(tenant_id, target_date + timedelta(days=offset))
        return await db.classoccurrence.find_many(
            where={
                "tenantId": tenant_id,
                "date": {"gte": _to_dt(target_date), "lte": _to_dt(last_date)},
                "OR": [{"facultyId": faculty_id}, {"substituteFacultyId": faculty_id}],
            },
            include={
                "courseSection": {"include": {"subject": True, "enrollments": True}},
                "classroom": True,
                "faculty": {"include": {"user": True}},
                "attendanceRecords": True,
            },
            order=[{"date": "asc"}, {"startTime": "asc"}],
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
        await _authorize_register_access(occurrence, user)

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
            students_payload.append({
                "student_id": student.id,
                "student_name": student_name,
                "enrollment_number": student.enrollmentNumber,
                "status": existing_rec.status if existing_rec else "ABSENT",
                "method": existing_rec.method if existing_rec else "MANUAL_REGISTER",
                "face_score": existing_rec.faceScore if existing_rec else None,
                "liveness_score": existing_rec.livenessScore if existing_rec else None,
                "evidence_photo_url": existing_rec.evidencePhotoUrl if existing_rec else None,
                "remarks": existing_rec.remarks if existing_rec else None,
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
        reason: Optional[str] = "Manual faculty attendance submission",
    ):
        user_id = user.id
        occurrence = await db.classoccurrence.find_first(
            where={"id": occurrence_id, "tenantId": tenant_id}
        )
        if not occurrence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found")
        await _authorize_register_access(occurrence, user)
        if occurrence.isAttendanceLocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Attendance register for this class is locked and cannot be modified.",
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

        await db.classoccurrence.update(
            where={"id": occurrence_id},
            data={"status": "CONDUCTED", "conductedAt": datetime.now()},
        )
        return {"success": True, "occurrence_id": occurrence_id, "records_processed": updated_count}
