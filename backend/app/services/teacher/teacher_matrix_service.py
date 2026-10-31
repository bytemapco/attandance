from typing import List, Optional
from fastapi import HTTPException, status

from app.db.client import db
from app.schemas.teacher import (
    AttendanceMatrixResponse,
    AttendanceMatrixSessionItem,
    AttendanceMatrixStudentItem,
    ClassStatsResponse,
    DistributionTiers,
    StatusDistribution,
    StudentAttendanceSummaryItem,
)


class TeacherMatrixService:
    @staticmethod
    def _resolve_full_name(first: Optional[str], last: Optional[str]) -> str:
        return f"{first or ''} {last or ''}".strip() or "—"

    @classmethod
    async def get_class_stats(cls, teacher_id: str, class_id: str) -> ClassStatsResponse:
        academic_class = await db.academicclass.find_unique(where={"id": class_id}, include={"subject": True})
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

        enrollments = await db.enrollment.find_many(
            where={"academicClassId": class_id},
            include={"student": {"include": {"user": True}}},
            order={"student": {"enrollmentNumber": "asc"}},
        )
        total_students = len(enrollments)
        sessions = await db.session.find_many(where={"academicClassId": class_id}, order={"startTime": "asc"})
        total_sessions = len(sessions)
        session_ids = [s.id for s in sessions]

        attendance_records = (
            await db.attendance.find_many(where={"sessionId": {"in": session_ids}}, order={"createdAt": "asc"})
            if session_ids
            else []
        )
        status_counts = {"Present": 0, "Absent": 0, "Flagged": 0, "Approved": 0}
        history: List[dict] = []
        student_records_map: dict[str, list] = {}

        for rec in attendance_records:
            st = rec.status
            if st in status_counts:
                status_counts[st] += 1
            student_records_map.setdefault(rec.studentId, []).append(rec)

        total_possible_slots = total_students * total_sessions
        total_present_approved = 0
        tier_counts = {"below_50": 0, "between_50_75": 0, "between_75_85": 0, "above_85": 0}
        student_summaries: List[StudentAttendanceSummaryItem] = []

        for enr in enrollments:
            std = enr.student
            std_user = std.user if std else None
            full_name = cls._resolve_full_name(std.firstName if std else None, std.lastName if std else None)
            std_records = student_records_map.get(std.id, []) if std else []
            attended = sum(1 for r in std_records if r.status in ["Present", "Approved"])
            total_present_approved += attended
            std_pct = round((attended / total_sessions * 100.0), 2) if total_sessions > 0 else 0.0

            if std_pct < 50.0:
                tier_counts["below_50"] += 1
            elif std_pct < 75.0:
                tier_counts["between_50_75"] += 1
            elif std_pct < 85.0:
                tier_counts["between_75_85"] += 1
            else:
                tier_counts["above_85"] += 1

            if std:
                latest_rec = max((r.createdAt for r in std_records if r.createdAt), default=None)
                student_summaries.append(
                    StudentAttendanceSummaryItem(
                        student_id=std.id,
                        enrollment_number=std.enrollmentNumber,
                        full_name=full_name,
                        email=std_user.email if std_user else "",
                        total_sessions=total_sessions,
                        attended_sessions=attended,
                        attendance_percentage=std_pct,
                        at_risk=(total_sessions > 0 and std_pct < 75.0),
                        last_attended_at=latest_rec,
                    )
                )

        overall_pct = round((total_present_approved / total_possible_slots) * 100.0, 2) if total_possible_slots > 0 else 0.0
        return ClassStatsResponse(
            class_id=class_id,
            class_name=academic_class.name,
            subject=academic_class.subject.name if academic_class.subject else "—",
            total_sessions=total_sessions,
            total_students=total_students,
            overall_attendance_percentage=overall_pct,
            at_risk_count=sum(1 for s in student_summaries if s.at_risk),
            status_distribution=StatusDistribution(
                present=status_counts["Present"],
                absent=status_counts["Absent"],
                flagged=status_counts["Flagged"],
                approved=status_counts["Approved"],
            ),
            distribution_tiers=DistributionTiers(
                below_50=tier_counts["below_50"],
                between_50_75=tier_counts["between_50_75"],
                between_75_85=tier_counts["between_75_85"],
                above_85=tier_counts["above_85"],
            ),
            history=history,
            students=student_summaries,
        )

    @classmethod
    async def get_class_attendance_matrix(cls, teacher_id: str, class_id: str) -> AttendanceMatrixResponse:
        academic_class = await db.academicclass.find_unique(where={"id": class_id}, include={"subject": True})
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

        enrollments = await db.enrollment.find_many(
            where={"academicClassId": class_id},
            include={"student": {"include": {"user": True}}},
            order={"student": {"enrollmentNumber": "asc"}},
        )
        sessions = await db.session.find_many(where={"academicClassId": class_id}, order={"startTime": "asc"})
        session_ids = [s.id for s in sessions]
        attendance_records = await db.attendance.find_many(where={"sessionId": {"in": session_ids}}) if session_ids else []
        matrix_records_map = {(r.studentId, r.sessionId): r.status for r in attendance_records}

        matrix_sessions = [
            AttendanceMatrixSessionItem(
                session_id=s.id,
                session_name=f"S{idx + 1}",
                session_date=s.startTime.strftime("%d %b") if s.startTime else f"S{idx + 1}",
            )
            for idx, s in enumerate(sessions)
        ]

        total_sessions = len(sessions)
        matrix_students: List[AttendanceMatrixStudentItem] = []

        for enr in enrollments:
            std = enr.student
            if not std:
                continue
            status_map: dict[str, str] = {}
            attended_count = 0
            for s in sessions:
                st = matrix_records_map.get((std.id, s.id), "Absent")
                status_map[s.id] = st
                if st in ["Present", "Approved"]:
                    attended_count += 1

            pct = round((attended_count / total_sessions * 100.0), 2) if total_sessions > 0 else 0.0
            matrix_students.append(
                AttendanceMatrixStudentItem(
                    student_id=std.id,
                    enrollment_number=std.enrollmentNumber,
                    full_name=cls._resolve_full_name(std.firstName, std.lastName),
                    attendance_percentage=pct,
                    statuses=status_map,
                )
            )

        return AttendanceMatrixResponse(
            class_id=class_id,
            class_name=academic_class.name,
            subject=academic_class.subject.name if academic_class.subject else "—",
            sessions=matrix_sessions,
            students=matrix_students,
        )
