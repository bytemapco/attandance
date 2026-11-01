from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from app.core.datetime_utils import get_ist_today
from app.db.client import db
from app.services.system_config_service import SystemConfigService


class TeacherScheduleService:
    @staticmethod
    async def get_weekly_timetable(tenant_id: str, faculty_id: str):
        where: dict = {
            "tenantId": tenant_id,
            "isActive": True,
            "OR": [
                {"teacherId": faculty_id},
                {"courseSection": {"is": {"faculties": {"some": {"teacherId": faculty_id}}}}},
            ],
        }

        rules = await db.timetablerule.find_many(
            where=where,
            include={
                "classroom": True,
                "courseSection": {"include": {"subject": True, "enrollments": True}},
            },
            order={"dayOfWeek": "asc"},
        )
        config = await SystemConfigService().get_config(tenant_id=tenant_id)
        return [
            {
                "id": r.id,
                "course_section_id": r.courseSectionId,
                "day_of_week": r.dayOfWeek,
                "start_time": r.startTime,
                "end_time": r.endTime,
                "classroom_name": r.classroom.name if r.classroom else "TBA",
                "classroom_id": r.classroomId,
                "section_name": r.courseSection.name if r.courseSection else "",
                "subject_name": r.courseSection.subject.name if r.courseSection and r.courseSection.subject else "",
                "subject_code": r.courseSection.subject.code if r.courseSection and r.courseSection.subject else "",
                "enrolled_count": len(r.courseSection.enrollments) if r.courseSection and r.courseSection.enrollments else 0,
                "saturday_enabled": config.saturdayEnabled,
            }
            for r in rules
        ]

    @staticmethod
    async def start_occurrence_attendance(tenant_id: str, faculty_id: str, occurrence_id: str):
        occurrence = await db.classoccurrence.find_first(
            where={"id": occurrence_id, "tenantId": tenant_id},
            include={"courseSection": {"include": {"subject": True}}},
        )
        if not occurrence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found.")
        if occurrence.facultyId != faculty_id and occurrence.substituteFacultyId != faculty_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for this occurrence.")
        if occurrence.isAttendanceLocked:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Occurrence attendance is locked.")
        if occurrence.status == "CANCELLED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This class was cancelled.")
        if occurrence.date.date() != get_ist_today():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attendance can only be started on the day of the class.")

        config = await SystemConfigService().get_config(tenant_id=tenant_id)
        window_min = config.verificationWindowMin

        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=window_min)

        return await db.classoccurrence.update(
            where={"id": occurrence_id},
            data={
                "verificationActive": True,
                "verificationExpires": expires,
                "status": "CONDUCTED",
                "conductedAt": now,
            },
        )

    @staticmethod
    async def stop_occurrence_attendance(tenant_id: str, faculty_id: str, user_id: str, occurrence_id: str):
        occurrence = await db.classoccurrence.find_first(
            where={"id": occurrence_id, "tenantId": tenant_id},
            include={
                "courseSection": {
                    "include": {
                        "enrollments": {
                            "include": {"student": {"include": {"leaveRequests": True}}}
                        }
                    }
                },
                "attendanceRecords": True,
            },
        )
        if not occurrence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class occurrence not found.")
        if occurrence.facultyId != faculty_id and occurrence.substituteFacultyId != faculty_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized for this occurrence.")

        # Deactivate verification window and lock
        now = datetime.now(timezone.utc)
        await db.classoccurrence.update(
            where={"id": occurrence_id},
            data={
                "verificationActive": False,
                "isAttendanceLocked": True,
                "status": "CONDUCTED",
            },
        )

        # Mark absent/excused for all students without a record
        existing_student_ids = {r.studentId for r in occurrence.attendanceRecords}
        marked_count = 0

        occ_date = (
            occurrence.date.replace(tzinfo=timezone.utc)
            if occurrence.date.tzinfo is None
            else occurrence.date
        )

        for enrollment in occurrence.courseSection.enrollments:
            student = enrollment.student
            if not student or student.id in existing_student_ids:
                continue

            on_leave = False
            if student.leaveRequests:
                for leave in student.leaveRequests:
                    if leave.status == "APPROVED":
                        l_start = leave.startDate.replace(tzinfo=timezone.utc) if leave.startDate.tzinfo is None else leave.startDate
                        l_end = leave.endDate.replace(tzinfo=timezone.utc) if leave.endDate.tzinfo is None else leave.endDate
                        if l_start.date() <= occ_date.date() <= l_end.date():
                            on_leave = True
                            break

            final_status = "EXCUSED" if on_leave else "ABSENT"
            reason_txt = "Excused via approved leave" if on_leave else "Auto-marked absent on register close"

            new_rec = await db.attendancerecord.create(
                data={
                    "tenantId": tenant_id,
                    "occurrenceId": occurrence_id,
                    "studentId": student.id,
                    "status": final_status,
                    "method": "SYSTEM_EXCUSED" if on_leave else "MANUAL_REGISTER",
                    "remarks": reason_txt,
                    "verifiedAt": now,
                }
            )
            await db.attendanceauditlog.create(
                data={
                    "attendanceRecordId": new_rec.id,
                    "previousStatus": "ABSENT",
                    "newStatus": final_status,
                    "changedById": user_id,
                    "reason": reason_txt,
                }
            )
            marked_count += 1

        return {
            "success": True,
            "occurrence_id": occurrence_id,
            "status": "LOCKED",
            "absent_marked_count": marked_count,
        }
