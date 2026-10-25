from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status

from app.core.logging_config import get_logger
from app.db.client import db

logger = get_logger("app.teacher")
from app.repositories.teacher_repository import TeacherRepository
from app.repositories.class_repository import ClassRepository
from app.repositories.geofence_repository import GeofenceRepository
from app.schemas.teacher import (
    GeofenceUpsert,
    GeofenceResponse,
    AcademicClassWithGeofenceResponse,
    StudentRosterItem,
    SessionAttendanceResponse,
    ClassStatsResponse,
    SessionWithClassResponse,
    SessionTrendItem,
    BulkMarkRequest,
    AbsentStudentItem,
    StatusDistribution,
    DistributionTiers,
    StudentAttendanceSummaryItem,
    StudentClassSessionLog,
    StudentClassHistoryResponse,
    AttendanceMatrixResponse,
    AttendanceMatrixSessionItem,
    AttendanceMatrixStudentItem,
)


class TeacherService:
    def __init__(self) -> None:
        self.teacher_repo = TeacherRepository()
        self.class_repo = ClassRepository()
        self.geofence_repo = GeofenceRepository()

    async def get_teacher_by_user_id(self, user_id: str):
        teacher = await self.teacher_repo.get_by_user_id(user_id)
        if not teacher:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher profile not found.")
        return teacher

    @staticmethod
    def _resolve_full_name(first: Optional[str], last: Optional[str]) -> str:
        return f"{first or ''} {last or ''}".strip() or "—"

    async def get_classes_by_teacher_user_id(self, user_id: str) -> List[AcademicClassWithGeofenceResponse]:
        teacher = await self.get_teacher_by_user_id(user_id)
        classes = await db.academicclass.find_many(
            where={"teacherId": teacher.id}, include={"geofence": True, "subject": True}
        )
        return [
            AcademicClassWithGeofenceResponse(
                id=c.id,
                name=c.name,
                subject=c.subject.name if c.subject else "—",
                teacherId=c.teacherId,
                geofence=GeofenceResponse.model_validate(c.geofence) if c.geofence else None,
            )
            for c in classes
        ]

    async def upsert_geofence(self, user_id: str, class_id: str, data: GeofenceUpsert) -> GeofenceResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        academic_class = await self.class_repo.get_by_id(class_id)
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You do not teach this academic class."
            )
        geofence = await self.geofence_repo.upsert_geofence(
            class_id=class_id, latitude=data.latitude, longitude=data.longitude, radius=data.radius_meters
        )
        return GeofenceResponse.model_validate(geofence)

    async def _get_session_with_auth(self, session_id: str, teacher_id: str):
        session = await db.session.find_unique(where={"id": session_id}, include={"academicClass": True})
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance Session not found.")
        if session.academicClass.teacherId != teacher_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You do not teach this academic class."
            )
        return session

    async def get_session_attendance_roster(self, user_id: str, session_id: str) -> SessionAttendanceResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        session = await self._get_session_with_auth(session_id, teacher.id)

        enrollments = await db.enrollment.find_many(
            where={"academicClassId": session.academicClassId},
            include={"student": {"include": {"user": True}}},
        )
        attendance_map = {r.studentId: r for r in await db.attendance.find_many(where={"sessionId": session_id})}

        roster = []
        for e in enrollments:
            s = e.student
            if not s:
                continue
            rec = attendance_map.get(s.id)
            roster.append(
                StudentRosterItem(
                    student_id=s.id,
                    enrollment_number=s.enrollmentNumber,
                    full_name=self._resolve_full_name(s.firstName, s.lastName),
                    email=s.user.email if s.user else "",
                    status=rec.status if rec else "Absent",
                    final_score=rec.finalAiScore if rec else 0.0,
                    marked_at=rec.createdAt if rec else None,
                )
            )
        return SessionAttendanceResponse(session_id=session_id, class_name=session.academicClass.name, roster=roster)

    async def get_absent_students(self, session_id: str, user_id: str) -> List[AbsentStudentItem]:
        teacher = await self.get_teacher_by_user_id(user_id)
        session = await self._get_session_with_auth(session_id, teacher.id)

        marked_ids = {r.studentId for r in await db.attendance.find_many(where={"sessionId": session_id})}
        enrollments = await db.enrollment.find_many(
            where={"academicClassId": session.academicClassId},
            include={"student": {"include": {"user": True}}},
        )
        return [
            AbsentStudentItem(
                student_id=s.id,
                enrollment_number=s.enrollmentNumber,
                full_name=self._resolve_full_name(s.firstName, s.lastName),
                email=s.user.email if s.user else "",
            )
            for e in enrollments
            if (s := e.student) and s.id not in marked_ids
        ]

    async def bulk_mark_attendance(self, session_id: str, user_id: str, request: BulkMarkRequest) -> int:
        teacher = await self.get_teacher_by_user_id(user_id)
        await self._get_session_with_auth(session_id, teacher.id)

        count = 0
        from app.services.gamification_service import GamificationService

        gamification_service = GamificationService()
        for record in request.records:
            await db.attendance.upsert(
                where={"studentId_sessionId": {"studentId": record.student_id, "sessionId": session_id}},
                data={
                    "create": {
                        "studentId": record.student_id,
                        "sessionId": session_id,
                        "status": record.status,
                        "faceScore": 0.0,
                        "livenessScore": 0.0,
                        "backgroundScore": 0.0,
                        "finalAiScore": 0.0,
                        "gpsLatitude": 0.0,
                        "gpsLongitude": 0.0,
                        "remarks": "Manual entry by teacher",
                    },
                    "update": {"status": record.status, "remarks": "Manual entry by teacher"},
                },
            )
            count += 1
            try:
                await gamification_service.recalculate_student_streak(record.student_id)
            except Exception as e:
                from app.core.logging_config import get_logger

                get_logger("app.teacher").warning(
                    "Failed to recalculate streak for student %s in bulk mark: %s", record.student_id, e
                )
        return count

    async def export_class_attendance(
        self, class_id: str, user_id: str, from_date: Optional[datetime], to_date: Optional[datetime]
    ) -> List[dict]:
        teacher = await self.get_teacher_by_user_id(user_id)
        academic_class = await self.class_repo.get_by_id(class_id)
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You do not teach this academic class."
            )

        session_where: dict = {"academicClassId": class_id}
        if from_date or to_date:
            time_filter = {}
            if from_date:
                time_filter["gte"] = from_date
            if to_date:
                time_filter["lte"] = to_date
            session_where["startTime"] = time_filter

        rows = []
        for s in await db.session.find_many(
            where=session_where, include={"academicClass": {"include": {"subject": True}}}, order={"startTime": "asc"}
        ):
            for rec in await db.attendance.find_many(
                where={"sessionId": s.id}, include={"student": {"include": {"user": True}}}
            ):
                stu = rec.student
                rows.append(
                    {
                        "enrollment_number": stu.enrollmentNumber if stu else "",
                        "first_name": stu.firstName or "" if stu else "",
                        "last_name": stu.lastName or "" if stu else "",
                        "email": stu.user.email if stu and stu.user else "",
                        "session_date": s.startTime.isoformat(),
                        "class_name": s.academicClass.name if s.academicClass else "—",
                        "subject": s.academicClass.subject.name if s.academicClass and s.academicClass.subject else "—",
                        "status": rec.status,
                        "final_ai_score": rec.finalAiScore,
                        "remarks": rec.remarks or "",
                    }
                )
        return rows

    async def get_class_stats(self, user_id: str, class_id: str) -> ClassStatsResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        academic_class = await db.academicclass.find_unique(where={"id": class_id}, include={"subject": True})
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

        enrollments = await db.enrollment.find_many(
            where={"academicClassId": class_id},
            include={"student": {"include": {"user": True}}},
            order={"student": {"enrollmentNumber": "asc"}},
        )
        total_students = len(enrollments)

        sessions = await db.session.find_many(
            where={"academicClassId": class_id},
            order={"startTime": "asc"},
        )
        total_sessions = len(sessions)

        session_ids = [s.id for s in sessions]
        attendance_records = (
            await db.attendance.find_many(
                where={"sessionId": {"in": session_ids}},
                order={"createdAt": "asc"},
            )
            if session_ids
            else []
        )

        # Index attendance records by (studentId, sessionId) and by studentId
        student_records_map: dict[str, list] = {}
        session_records_map: dict[str, list] = {}
        status_counts = {"Present": 0, "Absent": 0, "Flagged": 0, "Approved": 0}

        for rec in attendance_records:
            student_records_map.setdefault(rec.studentId, []).append(rec)
            session_records_map.setdefault(rec.sessionId, []).append(rec)
            if rec.status in status_counts:
                status_counts[rec.status] += 1
            elif rec.status == "Present":
                status_counts["Present"] += 1

        # Calculate implicit absences for students missing records in sessions
        total_possible_slots = total_students * total_sessions
        total_recorded = len(attendance_records)
        if total_possible_slots > total_recorded:
            status_counts["Absent"] += total_possible_slots - total_recorded

        # Build chronological session trend history
        history: List[SessionTrendItem] = []
        for idx, s in enumerate(sessions):
            s_records = session_records_map.get(s.id, [])
            p_count = sum(1 for r in s_records if r.status in ["Present", "Approved"])
            pct = round((p_count / total_students * 100.0), 2) if total_students > 0 else 0.0
            s_date = s.startTime.isoformat() if s.startTime else None
            history.append(
                SessionTrendItem(
                    session_id=s.id,
                    session_name=f"Session {idx + 1}",
                    session_date=s_date,
                    attendance_percentage=pct,
                )
            )

        # Build individual student attendance summary items
        student_summaries: List[StudentAttendanceSummaryItem] = []
        tier_counts = {"below_50": 0, "between_50_75": 0, "between_75_85": 0, "above_85": 0}
        total_present_approved = 0

        for enr in enrollments:
            std = enr.student
            std_user = std.user if std else None
            first_name = std.firstName if std else ""
            last_name = std.lastName if std else ""
            full_name = self._resolve_full_name(first_name, last_name)
            email = std_user.email if std_user else ""
            enrollment_number = std.enrollmentNumber if std else ""

            std_records = student_records_map.get(std.id, []) if std else []
            attended = sum(1 for r in std_records if r.status in ["Present", "Approved"])
            total_present_approved += attended

            std_pct = round((attended / total_sessions * 100.0), 2) if total_sessions > 0 else 0.0
            is_at_risk = total_sessions > 0 and std_pct < 75.0

            if std_pct < 50.0:
                tier_counts["below_50"] += 1
            elif std_pct < 75.0:
                tier_counts["between_50_75"] += 1
            elif std_pct < 85.0:
                tier_counts["between_75_85"] += 1
            else:
                tier_counts["above_85"] += 1

            # Get latest marked date
            latest_rec = max((r.createdAt for r in std_records if r.createdAt), default=None)

            if std:
                student_summaries.append(
                    StudentAttendanceSummaryItem(
                        student_id=std.id,
                        enrollment_number=enrollment_number,
                        full_name=full_name,
                        email=email,
                        total_sessions=total_sessions,
                        attended_sessions=attended,
                        attendance_percentage=std_pct,
                        at_risk=is_at_risk,
                        last_attended_at=latest_rec,
                    )
                )

        overall_pct = (
            round((total_present_approved / total_possible_slots) * 100.0, 2) if total_possible_slots > 0 else 0.0
        )
        at_risk_total = sum(1 for s in student_summaries if s.at_risk)

        return ClassStatsResponse(
            class_id=class_id,
            class_name=academic_class.name,
            subject=academic_class.subject.name if academic_class.subject else "—",
            total_sessions=total_sessions,
            total_students=total_students,
            overall_attendance_percentage=overall_pct,
            at_risk_count=at_risk_total,
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

    async def get_student_class_attendance_history(
        self, user_id: str, class_id: str, student_id: str
    ) -> StudentClassHistoryResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        academic_class = await db.academicclass.find_unique(where={"id": class_id}, include={"subject": True})
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

        enrollment = await db.enrollment.find_first(
            where={"studentId": student_id, "academicClassId": class_id},
            include={"student": {"include": {"user": True}}},
        )
        if not enrollment or not enrollment.student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not enrolled in this class.")

        student = enrollment.student
        student_user = student.user
        full_name = self._resolve_full_name(student.firstName, student.lastName)

        sessions = await db.session.find_many(
            where={"academicClassId": class_id},
            order={"startTime": "desc"},
        )
        total_sessions = len(sessions)
        session_ids = [s.id for s in sessions]

        records = (
            await db.attendance.find_many(where={"studentId": student_id, "sessionId": {"in": session_ids}})
            if session_ids
            else []
        )
        records_by_session = {r.sessionId: r for r in records}

        session_logs: List[StudentClassSessionLog] = []
        attended_count = 0

        for idx, s in enumerate(reversed(sessions)):
            pass  # keep ordering reference if needed

        for idx, s in enumerate(sessions):
            rec = records_by_session.get(s.id)
            current_status = rec.status if rec else "Absent"
            if current_status in ["Present", "Approved"]:
                attended_count += 1

            s_date = s.startTime.strftime("%Y-%m-%d") if s.startTime else "N/A"
            session_name = f"Session {len(sessions) - idx} ({s_date})"

            session_logs.append(
                StudentClassSessionLog(
                    session_id=s.id,
                    session_name=session_name,
                    session_date=s_date,
                    start_time=s.startTime,
                    end_time=s.endTime,
                    status=current_status,
                    final_ai_score=rec.finalAiScore if rec else 0.0,
                    marked_at=rec.createdAt if rec else None,
                    remarks=rec.remarks if rec else None,
                    student_note=rec.studentNote if rec else None,
                )
            )

        attendance_pct = round((attended_count / total_sessions * 100.0), 2) if total_sessions > 0 else 0.0

        return StudentClassHistoryResponse(
            student_id=student.id,
            student_name=full_name,
            enrollment_number=student.enrollmentNumber,
            email=student_user.email if student_user else "",
            class_id=class_id,
            class_name=academic_class.name,
            subject=academic_class.subject.name if academic_class.subject else "—",
            total_sessions=total_sessions,
            attended_sessions=attended_count,
            attendance_percentage=attendance_pct,
            at_risk=(total_sessions > 0 and attendance_pct < 75.0),
            sessions=session_logs,
        )

    async def get_class_attendance_matrix(self, user_id: str, class_id: str) -> AttendanceMatrixResponse:
        teacher = await self.get_teacher_by_user_id(user_id)
        academic_class = await db.academicclass.find_unique(where={"id": class_id}, include={"subject": True})
        if not academic_class:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Academic Class not found.")
        if academic_class.teacherId != teacher.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

        enrollments = await db.enrollment.find_many(
            where={"academicClassId": class_id},
            include={"student": {"include": {"user": True}}},
            order={"student": {"enrollmentNumber": "asc"}},
        )
        sessions = await db.session.find_many(
            where={"academicClassId": class_id},
            order={"startTime": "asc"},
        )
        session_ids = [s.id for s in sessions]
        attendance_records = (
            await db.attendance.find_many(where={"sessionId": {"in": session_ids}}) if session_ids else []
        )

        matrix_records_map: dict[tuple[str, str], str] = {
            (r.studentId, r.sessionId): r.status for r in attendance_records
        }

        matrix_sessions: List[AttendanceMatrixSessionItem] = [
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
            full_name = self._resolve_full_name(std.firstName, std.lastName)
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
                    full_name=full_name,
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

    async def manual_override_attendance(self, user_id: str, session_id: str, student_id: str, status_val: str) -> bool:
        teacher = await self.get_teacher_by_user_id(user_id)
        session = await self._get_session_with_auth(session_id, teacher.id)

        enrollment = await db.enrollment.find_unique(
            where={"studentId_academicClassId": {"studentId": student_id, "academicClassId": session.academicClassId}}
        )
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student is not enrolled in this class.")

        existing = await db.attendance.find_unique(
            where={"studentId_sessionId": {"studentId": student_id, "sessionId": session_id}}
        )
        if existing:
            await db.attendance.update(
                where={"id": existing.id},
                data={"status": status_val, "remarks": f"Manual override by Teacher to {status_val}"},
            )
        else:
            score = 1.0 if status_val == "Present" else 0.0
            await db.attendance.create(
                data={
                    "studentId": student_id,
                    "sessionId": session_id,
                    "status": status_val,
                    "faceScore": score,
                    "livenessScore": score,
                    "backgroundScore": score,
                    "finalAiScore": score,
                    "gpsLatitude": 0.0,
                    "gpsLongitude": 0.0,
                    "remarks": f"Manual override by Teacher to {status_val}",
                }
            )

        try:
            from app.services.gamification_service import GamificationService

            await GamificationService().recalculate_student_streak(student_id)
        except Exception as e:
            from app.core.logging_config import get_logger

            get_logger("app.teacher").warning(
                "Failed to recalculate streak for student %s in manual override: %s", student_id, e
            )

        return True

    async def get_teacher_sessions(self, user_id: str) -> List[SessionWithClassResponse]:
        teacher = await self.get_teacher_by_user_id(user_id)
        sessions = await db.session.find_many(
            where={"academicClass": {"teacherId": teacher.id}},
            include={"academicClass": {"include": {"subject": True}}},
            order={"endTime": "desc"},
        )

        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)

        # Proactively deactivate expired sessions in DB
        expired_ids = [
            s.id
            for s in sessions
            if s.isActive and (s.endTime.replace(tzinfo=timezone.utc) if s.endTime.tzinfo is None else s.endTime) <= now
        ]
        if expired_ids:
            from app.services.session_service import SessionService

            session_service = SessionService()
            for s_id in expired_ids:
                try:
                    await session_service.close_session(s_id)
                except Exception as e:
                    from app.core.logging_config import get_logger

                    get_logger("app.teacher").warning("Failed to close expired session %s: %s", s_id, e)

        return [
            SessionWithClassResponse(
                id=s.id,
                academicClassId=s.academicClassId,
                class_name=s.academicClass.name,
                subject=s.academicClass.subject.name if s.academicClass and s.academicClass.subject else "—",
                startTime=s.startTime,
                endTime=s.endTime,
                isActive=s.isActive
                and (s.endTime.replace(tzinfo=timezone.utc) if s.endTime.tzinfo is None else s.endTime) > now,
            )
            for s in sessions
        ]

    async def verify_smart_pass(self, user_id: str, session_id: str, qr_token: str):
        from app.core.security import decode_access_token
        from app.services.gamification_service import GamificationService
        from app.api.websocket import manager
        from app.schemas.teacher import SmartPassVerifyResponse

        payload = decode_access_token(qr_token)
        if not payload or payload.get("type") != "smart_pass":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired Smart Pass QR token. Please refresh the QR code on the student app.",
            )

        student_id = payload.get("student_id")
        user_sub = payload.get("sub")

        student = None
        if student_id:
            student = await db.student.find_unique(where={"id": student_id}, include={"user": True})
        elif user_sub:
            student = await db.student.find_unique(where={"userId": user_sub}, include={"user": True})

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Student profile matching QR pass not found."
            )

        teacher = await self.get_teacher_by_user_id(user_id)
        session = await self._get_session_with_auth(session_id, teacher.id)

        now = datetime.now(timezone.utc)
        sess_end = session.endTime.replace(tzinfo=timezone.utc) if session.endTime.tzinfo is None else session.endTime
        if not session.isActive or sess_end <= now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is closed or has expired.")

        enrollment = await db.enrollment.find_first(
            where={"studentId": student.id, "academicClassId": session.academicClassId}
        )
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Student {student.enrollmentNumber} is not enrolled in {session.academicClass.name}.",
            )

        student_full_name = self._resolve_full_name(student.firstName, student.lastName)
        existing = await db.attendance.find_first(where={"studentId": student.id, "sessionId": session_id})

        if existing and existing.status == "Present":
            return SmartPassVerifyResponse(
                status="already_marked",
                student_id=student.id,
                student_name=student_full_name,
                enrollment_number=student.enrollmentNumber,
                attendance_status="Present",
                session_id=session_id,
                message=f"Attendance already marked Present for {student_full_name} ({student.enrollmentNumber}).",
            )

        if existing:
            await db.attendance.update(
                where={"id": existing.id},
                data={
                    "status": "Present",
                    "finalAiScore": 1.0,
                    "remarks": "Verified via Smart Pass QR",
                },
            )
        else:
            await db.attendance.create(
                data={
                    "studentId": student.id,
                    "sessionId": session_id,
                    "status": "Present",
                    "faceScore": 1.0,
                    "livenessScore": 1.0,
                    "backgroundScore": 1.0,
                    "finalAiScore": 1.0,
                    "gpsLatitude": 0.0,
                    "gpsLongitude": 0.0,
                    "remarks": "Verified via Smart Pass QR",
                }
            )

        try:
            await GamificationService().recalculate_student_streak(student.id)
        except Exception as e:
            from app.core.logging_config import get_logger

            get_logger("app.teacher").warning("Streak calculation failed: %s", e)

        try:
            msg = {
                "type": "attendance_updated",
                "session_id": session_id,
                "status": "Present",
                "student_id": student.id,
            }
            await manager.send_personal_message(msg, student_id=student.id)
            await manager.broadcast_to_teachers(msg)
        except Exception as ws_err:
            logger.warning("Failed broadcasting attendance update in smart pass verify for %s: %s", student.id, ws_err)

        # Create audit log
        try:
            actor_email = user_id
            if teacher and teacher.user and teacher.user.email:
                actor_email = teacher.user.email
            await db.auditlog.create(
                data={
                    "eventType": "SMART_PASS_VERIFY",
                    "severity": "INFO",
                    "actor": actor_email,
                    "target": f"student:{student.enrollmentNumber}",
                    "description": f"Verified student {student_full_name} ({student.enrollmentNumber}) via Smart Pass QR for session {session_id}",
                }
            )
        except Exception as audit_err:
            logger.warning("Failed creating audit log for smart pass verify for %s: %s", student.id, audit_err)

        return SmartPassVerifyResponse(
            status="success",
            student_id=student.id,
            student_name=student_full_name,
            enrollment_number=student.enrollmentNumber,
            attendance_status="Present",
            session_id=session_id,
            message=f"Successfully verified {student_full_name} ({student.enrollmentNumber}).",
        )

    async def generate_session_smart_pass(self, user_id: str, session_id: str):
        import uuid
        from datetime import timedelta
        from app.core.security import create_access_token
        from app.schemas.teacher import TeacherSmartPassResponse

        teacher = await self.get_teacher_by_user_id(user_id)
        session = await self._get_session_with_auth(session_id, teacher.id)

        now = datetime.now(timezone.utc)
        sess_end = session.endTime.replace(tzinfo=timezone.utc) if session.endTime.tzinfo is None else session.endTime
        if not session.isActive or sess_end <= now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is closed or has expired.")

        class_name = session.academicClass.name if session.academicClass else "Class"
        subject_name = (
            session.academicClass.subject.name
            if session.academicClass and session.academicClass.subject
            else class_name
        )

        expires_delta = timedelta(seconds=15)
        qr_token = create_access_token(
            subject=teacher.userId,
            role="TEACHER",
            expires_delta=expires_delta,
            extra_data={
                "session_id": session.id,
                "academic_class_id": session.academicClassId,
                "teacher_id": teacher.id,
                "type": "teacher_smart_pass",
                "nonce": uuid.uuid4().hex[:12],
            },
        )

        return TeacherSmartPassResponse(
            qr_token=qr_token,
            session_id=session.id,
            class_name=class_name,
            subject=subject_name,
            expires_at=(now + expires_delta).isoformat(),
            refresh_interval_seconds=5,
        )
