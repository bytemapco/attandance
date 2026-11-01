from typing import List, Optional
from app.db.client import db
from app.schemas.search import GlobalSearchResponse, SearchResultItem


class AdminSearchService:
    @staticmethod
    def _resolve_name(first: Optional[str], last: Optional[str]) -> str:
        return f"{first or ''} {last or ''}".strip() or "—"

    @classmethod
    async def search(cls, user_id: str, query: str, tenant_id: Optional[str] = None) -> GlobalSearchResponse:
        results: List[SearchResultItem] = []

        actions = [
            SearchResultItem(
                id="admin-act-add-student",
                title="Add Student",
                subtitle="Create a student account and enrollment record",
                category="action",
                href="/admin/users/students/add",
                icon_type="user-plus",
                badge="Create",
            ),
            SearchResultItem(
                id="admin-act-add-teacher",
                title="Add Faculty",
                subtitle="Create a teacher account and department assignment",
                category="action",
                href="/admin/users/teachers/add",
                icon_type="user-check",
                badge="Create",
            ),
            SearchResultItem(
                id="admin-act-create-class",
                title="Create Class",
                subtitle="Setup a new course section and assign faculty",
                category="action",
                href="/admin/classes/create",
                icon_type="book-plus",
                badge="Create",
            ),
            SearchResultItem(
                id="admin-act-scanner",
                title="Absentee Scanner",
                subtitle="Detect chronic attendance anomalies",
                category="action",
                href="/admin/scanner",
                icon_type="cpu",
                badge="AI Tool",
            ),
        ]

        if not query:
            return GlobalSearchResponse(query=query, total_results=len(actions), results=actions)

        q_lower = query.lower()
        for act in actions:
            if q_lower in act.title.lower() or (act.subtitle and q_lower in act.subtitle.lower()):
                results.append(act)

        student_where: dict = {
            "OR": [
                {"firstName": {"contains": query, "mode": "insensitive"}},
                {"lastName": {"contains": query, "mode": "insensitive"}},
                {"enrollmentNumber": {"contains": query, "mode": "insensitive"}},
                {"user": {"is": {"email": {"contains": query, "mode": "insensitive"}}}},
            ]
        }
        if tenant_id:
            student_where["user"] = {"is": {"tenantId": tenant_id}}

        students = await db.student.find_many(
            where=student_where,
            include={"user": True, "department": True},
            take=12,
        )
        for s in students:
            full_name = cls._resolve_name(s.firstName, s.lastName)
            dept = s.department.name if s.department else "Student"
            email = s.user.email if s.user else ""
            results.append(
                SearchResultItem(
                    id=f"student-{s.id}",
                    title=full_name,
                    subtitle=f"{s.enrollmentNumber} • {dept} • {email}",
                    category="student",
                    href=f"/admin/users/students/{s.id}",
                    icon_type="graduation-cap",
                    badge="Student",
                )
            )

        teacher_where: dict = {
            "OR": [
                {"firstName": {"contains": query, "mode": "insensitive"}},
                {"lastName": {"contains": query, "mode": "insensitive"}},
                {"employeeId": {"contains": query, "mode": "insensitive"}},
                {"user": {"is": {"email": {"contains": query, "mode": "insensitive"}}}},
            ]
        }
        if tenant_id:
            teacher_where["user"] = {"is": {"tenantId": tenant_id}}

        teachers = await db.teacher.find_many(
            where=teacher_where,
            include={"user": True, "department": True, "designation": True},
            take=10,
        )
        for t in teachers:
            full_name = cls._resolve_name(t.firstName, t.lastName)
            dept = t.department.name if t.department else "Faculty"
            desig = t.designation.name if t.designation and hasattr(t.designation, "name") else "Professor"
            results.append(
                SearchResultItem(
                    id=f"teacher-{t.id}",
                    title=f"Prof. {full_name}",
                    subtitle=f"{t.employeeId} • {desig} • {dept}",
                    category="faculty",
                    href=f"/admin/users/teachers/{t.id}",
                    icon_type="users",
                    badge="Faculty",
                )
            )

        class_where: dict = {
            "OR": [
                {"name": {"contains": query, "mode": "insensitive"}},
                {"subject": {"is": {"name": {"contains": query, "mode": "insensitive"}}}},
                {"subject": {"is": {"code": {"contains": query, "mode": "insensitive"}}}},
            ]
        }
        if tenant_id:
            class_where["tenantId"] = tenant_id

        classes = await db.academicclass.find_many(
            where=class_where,
            include={"subject": True, "teacher": True},
            take=10,
        )
        for c in classes:
            subj_name = c.subject.name if c.subject else ""
            teacher_name = cls._resolve_name(c.teacher.firstName, c.teacher.lastName) if c.teacher else "Unassigned"
            results.append(
                SearchResultItem(
                    id=f"class-{c.id}",
                    title=c.name,
                    subtitle=f"{subj_name} • Faculty: {teacher_name}",
                    category="class",
                    href=f"/admin/classes/{c.id}",
                    icon_type="book-open",
                    badge="Course",
                )
            )

        return GlobalSearchResponse(query=query, total_results=len(results), results=results)
