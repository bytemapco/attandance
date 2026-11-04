from datetime import datetime, timezone
from typing import List, Optional

from app.db.client import db
from app.schemas.search import GlobalSearchResponse, SearchResultItem

ACTIONS = [
    ("act-start-session", "Start Attendance Session", "Open attendance for today's class", "/teacher/today", "radio", "Action"),
    ("act-review-queue", "Review Flagged Records", "Approve or reject low-confidence check-ins", "/teacher/review", "clipboard-check", "Review"),
    ("act-leave-requests", "Student Leave Requests", "Approve medical and academic leaves", "/teacher/leaves", "calendar", "Leaves"),
    ("act-device-changes", "Device Updates", "Review phone re-binding requests", "/teacher/device-changes", "smartphone", "Security"),
    ("act-analytics-at-risk", "Class Analytics", "Attendance trends and at-risk students", "/teacher/analytics", "activity", "Analytics"),
    ("act-attendance-history", "Attendance History", "View past classes and attendance sheets", "/teacher/history", "calendar", "History"),
]


def _contains(query: str) -> dict:
    return {"contains": query, "mode": "insensitive"}


def _resolve_name(first: Optional[str], last: Optional[str]) -> str:
    return f"{first or ''} {last or ''}".strip() or "—"


def _action_items() -> List[SearchResultItem]:
    return [
        SearchResultItem(id=i, title=title, subtitle=sub, category="action", href=href, icon_type=icon, badge=badge)
        for i, title, sub, href, icon, badge in ACTIONS
    ]


class TeacherSearchService:
    @classmethod
    async def search(cls, user_id: str, query: str) -> GlobalSearchResponse:
        teacher = await db.teacher.find_unique(where={"userId": user_id})
        if not teacher:
            return GlobalSearchResponse(query=query, total_results=0, results=[])

        actions = _action_items()
        if not query:
            return GlobalSearchResponse(query=query, total_results=len(actions), results=actions)

        q_lower = query.lower()
        results = [a for a in actions if q_lower in a.title.lower() or q_lower in (a.subtitle or "").lower()]

        mine = {"tenantId": teacher.tenantId, "faculties": {"some": {"teacherId": teacher.id}}}
        sections = await db.coursesection.find_many(where=mine, include={"subject": True})
        results += _section_results(sections, q_lower)
        if sections:
            section_ids = [s.id for s in sections]
            results += await _student_results(teacher.tenantId, section_ids, query)
            results += await _class_log_results(teacher.tenantId, section_ids, query)

        return GlobalSearchResponse(query=query, total_results=len(results), results=results)


def _section_results(sections, q_lower: str) -> List[SearchResultItem]:
    return [
        SearchResultItem(
            id=f"class-{s.id}",
            title=s.name,
            subtitle=f"{s.subject.name} ({s.subject.code})",
            category="class",
            href="/teacher/analytics",
            icon_type="book-open",
            badge="My Class",
        )
        for s in sections
        if q_lower in s.name.lower() or q_lower in s.subject.name.lower() or q_lower in s.subject.code.lower()
    ]


async def _student_results(tenant_id: str, section_ids: List[str], query: str) -> List[SearchResultItem]:
    enrollments = await db.courseenrollment.find_many(
        where={
            "courseSectionId": {"in": section_ids},
            "status": "ACTIVE",
            "endedAt": None,
            "student": {
                "is": {
                    "tenantId": tenant_id,
                    "OR": [
                        {"firstName": _contains(query)},
                        {"lastName": _contains(query)},
                        {"enrollmentNumber": _contains(query)},
                        {"user": {"is": {"email": _contains(query)}}},
                    ],
                }
            },
        },
        include={"student": {"include": {"user": True}}, "courseSection": True},
        take=15,
    )
    seen: set = set()
    results = []
    for enr in enrollments:
        student = enr.student
        if student.id in seen:
            continue
        seen.add(student.id)
        email = student.user.email if student.user else ""
        results.append(
            SearchResultItem(
                id=f"student-{student.id}",
                title=_resolve_name(student.firstName, student.lastName),
                subtitle=f"{student.enrollmentNumber} • {enr.courseSection.name} • {email}",
                category="student",
                href="/teacher/analytics",
                icon_type="graduation-cap",
                badge="Enrolled",
            )
        )
    return results


async def _class_log_results(tenant_id: str, section_ids: List[str], query: str) -> List[SearchResultItem]:
    occurrences = await db.classoccurrence.find_many(
        where={
            "tenantId": tenant_id,
            "courseSectionId": {"in": section_ids},
            "courseSection": {"is": {"OR": [{"name": _contains(query)}, {"subject": {"is": {"name": _contains(query)}}}]}},
        },
        include={"courseSection": True},
        order=[{"date": "desc"}, {"startTime": "desc"}],
        take=8,
    )
    now = datetime.now(timezone.utc)
    results = []
    for o in occurrences:
        live = o.verificationActive and o.verificationExpires is not None and o.verificationExpires > now
        results.append(
            SearchResultItem(
                id=f"session-{o.id}",
                title=f"{o.courseSection.name} Attendance",
                subtitle=f"{o.date.strftime('%d %b %Y')}, {o.startTime}–{o.endTime}",
                category="session",
                href=f"/teacher/attendance/{o.id}",
                icon_type="calendar",
                badge="LIVE" if live else "Closed",
            )
        )
    return results
