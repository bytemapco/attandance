from typing import List, Optional
from app.db.client import db
from app.schemas.search import GlobalSearchResponse, SearchResultItem


class TeacherSearchService:
    @staticmethod
    def _resolve_name(first: Optional[str], last: Optional[str]) -> str:
        return f"{first or ''} {last or ''}".strip() or "—"

    @classmethod
    async def search(cls, user_id: str, query: str) -> GlobalSearchResponse:
        results: List[SearchResultItem] = []
        teacher = await db.teacher.find_unique(where={"userId": user_id})
        if not teacher:
            return GlobalSearchResponse(query=query, total_results=0, results=[])

        my_classes = await db.academicclass.find_many(where={"teacherId": teacher.id}, include={"subject": True})
        my_class_ids = [c.id for c in my_classes]

        actions = [
            SearchResultItem(
                id="act-start-session",
                title="Start Attendance Session",
                subtitle="Launch real-time Face Match & Smart Pass",
                category="action",
                href="/teacher/sessions",
                icon_type="radio",
                badge="Action",
            ),
            SearchResultItem(
                id="act-review-queue",
                title="Review Flagged Records",
                subtitle="Approve or reject low-confidence check-ins",
                category="action",
                href="/teacher/review",
                icon_type="clipboard-check",
                badge="Review",
            ),
            SearchResultItem(
                id="act-leave-requests",
                title="Student Leave Requests",
                subtitle="Approve medical and academic leaves",
                category="action",
                href="/teacher/leaves",
                icon_type="calendar",
                badge="Leaves",
            ),
            SearchResultItem(
                id="act-device-changes",
                title="Device Updates",
                subtitle="Review phone re-binding requests",
                category="action",
                href="/teacher/device-changes",
                icon_type="smartphone",
                badge="Security",
            ),
            SearchResultItem(
                id="act-analytics-at-risk",
                title="Class Analytics",
                subtitle="Attendance trends and at-risk students",
                category="action",
                href="/teacher/analytics",
                icon_type="activity",
                badge="Analytics",
            ),
            SearchResultItem(
                id="act-attendance-history",
                title="Attendance History",
                subtitle="View past session logs and attendance sheets",
                category="action",
                href="/teacher/history",
                icon_type="calendar",
                badge="History",
            ),
        ]

        if not query:
            return GlobalSearchResponse(query=query, total_results=len(actions), results=actions)

        q_lower = query.lower()
        for act in actions:
            if q_lower in act.title.lower() or (act.subtitle and q_lower in act.subtitle.lower()):
                results.append(act)

        for c in my_classes:
            subj_name = c.subject.name if c.subject else ""
            subj_code = c.subject.code if c.subject else ""
            if q_lower in c.name.lower() or q_lower in subj_name.lower() or q_lower in subj_code.lower():
                results.append(
                    SearchResultItem(
                        id=f"class-{c.id}",
                        title=c.name,
                        subtitle=f"{subj_name} ({subj_code})" if subj_code else subj_name,
                        category="class",
                        href=f"/teacher/classes/{c.id}",
                        icon_type="book-open",
                        badge="My Class",
                    )
                )

        if my_class_ids:
            enrollments = await db.enrollment.find_many(
                where={
                    "academicClassId": {"in": my_class_ids},
                    "student": {
                        "is": {
                            "OR": [
                                {"firstName": {"contains": query, "mode": "insensitive"}},
                                {"lastName": {"contains": query, "mode": "insensitive"}},
                                {"enrollmentNumber": {"contains": query, "mode": "insensitive"}},
                                {"user": {"is": {"email": {"contains": query, "mode": "insensitive"}}}},
                            ]
                        }
                    },
                },
                include={"student": {"include": {"user": True}}, "academicClass": {"include": {"subject": True}}},
                take=15,
            )
            seen_students = set()
            for enr in enrollments:
                std = enr.student
                if not std or std.id in seen_students:
                    continue
                seen_students.add(std.id)
                full_name = cls._resolve_name(std.firstName, std.lastName)
                c_name = enr.academicClass.name if enr.academicClass else "Class"
                email = std.user.email if std.user else ""
                results.append(
                    SearchResultItem(
                        id=f"student-{std.id}",
                        title=full_name,
                        subtitle=f"{std.enrollmentNumber} • {c_name} • {email}",
                        category="student",
                        href="/teacher/analytics",
                        icon_type="graduation-cap",
                        badge="Enrolled",
                    )
                )

            sessions = await db.session.find_many(
                where={
                    "academicClassId": {"in": my_class_ids},
                    "academicClass": {
                        "is": {
                            "OR": [
                                {"name": {"contains": query, "mode": "insensitive"}},
                                {"subject": {"is": {"name": {"contains": query, "mode": "insensitive"}}}},
                            ]
                        }
                    },
                },
                include={"academicClass": {"include": {"subject": True}}},
                order={"startTime": "desc"},
                take=8,
            )
            for s in sessions:
                c_name = s.academicClass.name if s.academicClass else "Session"
                s_date = s.startTime.strftime("%d %b %Y, %I:%M %p") if s.startTime else "N/A"
                badge = "LIVE" if s.isActive else "Closed"
                results.append(
                    SearchResultItem(
                        id=f"session-{s.id}",
                        title=f"{c_name} Attendance Log",
                        subtitle=s_date,
                        category="session",
                        href=f"/teacher/sessions/{s.id}/attendance-roll",
                        icon_type="calendar",
                        badge=badge,
                    )
                )

        return GlobalSearchResponse(query=query, total_results=len(results), results=results)
