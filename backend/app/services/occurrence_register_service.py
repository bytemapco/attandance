from datetime import date, datetime
from typing import List, Optional
from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.timetable import AttendanceRegisterItem
from app.services.occurrence_generator import OccurrenceGenerator


def _to_dt(d: date) -> datetime:
    return datetime(d.year, d.month, d.day, 0, 0, 0)


class OccurrenceRegisterService:
    @staticmethod
    async def get_daily_schedule(tenant_id: str, faculty_id: str, target_date: date):
        await OccurrenceGenerator.generate_occurrences_for_date(tenant_id, target_date)
        target_dt = _to_dt(target_date)
        return await db.classoccurrence.find_many(
            where={
                "tenantId": tenant_id,
                "date": target_dt,
                "OR": [{"facultyId": faculty_id}, {"substituteFacultyId": faculty_id}],
            },
            include={
                "courseSection": {"include": {"subject": True, "enrollments": True}},
                "timeSlot": True,
                "classroom": True,
                "faculty": {"include": {"user": True}},
                "attendanceRecords": True,
            },
            order={"timeSlot": {"startTime": "asc"}},
        )

    @staticmethod
    async def get_occurrence_register(tenant_id: str, occurrence_id: str):
        occurrence = await db.classoccurrence.find_first(
            where={"id": occurrence_id, "tenantId": tenant_id},
            include={
                "courseSection": {
                    "include": {
                        "subject": True,
                        "enrollments": {"include": {"student": {"include": {"user": True}}}},
                    }
                },
                "timeSlot": True,
                "classroom": True,
                "attendanceRecords": True,
            },
        )
        if not occurrence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found")

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
            "course_name": occurrence.courseSection.subject.name if occurrence.courseSection.subject else "Class",
            "section_name": occurrence.courseSection.name,
            "time_slot": f"{occurrence.timeSlot.startTime} - {occurrence.timeSlot.endTime}",
            "students": students_payload,
        }

    @staticmethod
    async def update_register_bulk(
        tenant_id: str,
        user_id: str,
        occurrence_id: str,
        updates: List[AttendanceRegisterItem],
        reason: Optional[str] = "Manual faculty attendance submission",
    ):
        occurrence = await db.classoccurrence.find_first(
            where={"id": occurrence_id, "tenantId": tenant_id}
        )
        if not occurrence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found")
        if occurrence.isAttendanceLocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Attendance register for this class is locked and cannot be modified.",
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
