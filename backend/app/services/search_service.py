from typing import List, Optional
from prisma.models import User
from app.db.client import db
from app.schemas.search import SearchResultItem, GlobalSearchResponse


class GlobalSearchService:
    @staticmethod
    def _resolve_name(first: Optional[str], last: Optional[str]) -> str:
        return f"{first or ''} {last or ''}".strip() or "—"

    async def search(self, user: User, query: str) -> GlobalSearchResponse:
        clean_q = query.strip()
        tid = getattr(user, "tenantId", None)
        if user.role == "ADMIN":
            return await self.search_for_admin(user.id, clean_q, tenant_id=tid)
        elif user.role == "TEACHER":
            return await self.search_for_teacher(user.id, clean_q)
        else:
            return GlobalSearchResponse(query=clean_q, total_results=0, results=[])

    async def search_for_teacher(self, user_id: str, query: str) -> GlobalSearchResponse:
        results: List[SearchResultItem] = []
        teacher = await db.teacher.find_unique(where={"userId": user_id})
        if not teacher:
            return GlobalSearchResponse(query=query, total_results=0, results=[])

        # Teacher Classes
        my_classes = await db.academicclass.find_many(
            where={"teacherId": teacher.id},
            include={"subject": True},
        )
        my_class_ids = [c.id for c in my_classes]

        # 1. Quick Actions
        actions = [
            SearchResultItem(
                id="act-start-session",
                title="Broadcast Live Attendance Session",
                subtitle="Open real-time Face Match & Smart Pass verification",
                category="action",
                href="/teacher/sessions",
                icon_type="radio",
                badge="Action",
            ),
            SearchResultItem(
                id="act-analytics-defaulters",
                title="View Attendance Analytics & Defaulters",
                subtitle="Track students below the 75% institutional requirement",
                category="action",
                href="/teacher/analytics",
                icon_type="activity",
                badge="Analytics",
            ),
            SearchResultItem(
                id="act-review-queue",
                title="Review Flagged AI Attendance Records",
                subtitle="Approve or reject low-confidence attendance check-ins",
                category="action",
                href="/teacher/review",
                icon_type="clipboard-check",
                badge="Review",
            ),
            SearchResultItem(
                id="act-leave-requests",
                title="Review Student Leave Requests",
                subtitle="Approve medical and academic leave submissions",
                category="action",
                href="/teacher/leaves",
                icon_type="calendar",
                badge="Leaves",
            ),
            SearchResultItem(
                id="act-device-changes",
                title="Approve Device Change Requests",
                subtitle="Authorize student hardware phone re-binding",
                category="action",
                href="/teacher/device-changes",
                icon_type="smartphone",
                badge="Security",
            ),
        ]

        if not query:
            return GlobalSearchResponse(
                query=query,
                total_results=len(actions),
                results=actions,
            )

        q_lower = query.lower()

        # Match Actions
        for act in actions:
            if q_lower in act.title.lower() or (act.subtitle and q_lower in act.subtitle.lower()):
                results.append(act)

        # 2. Search Classes
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

        # 3. Search Students enrolled in teacher's classes
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
                include={
                    "student": {"include": {"user": True}},
                    "academicClass": {"include": {"subject": True}},
                },
                take=15,
            )

            seen_students = set()
            for enr in enrollments:
                std = enr.student
                if not std or std.id in seen_students:
                    continue
                seen_students.add(std.id)

                full_name = self._resolve_name(std.firstName, std.lastName)
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

        # 4. Search Sessions
        if my_class_ids:
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
                        subtitle=f"{s_date} • Session ID: {s.id[:8]}",
                        category="session",
                        href=f"/teacher/sessions/{s.id}/roster",
                        icon_type="calendar",
                        badge=badge,
                    )
                )

        return GlobalSearchResponse(
            query=query,
            total_results=len(results),
            results=results,
        )

    async def search_for_admin(self, user_id: str, query: str, tenant_id: Optional[str] = None) -> GlobalSearchResponse:
        results: List[SearchResultItem] = []

        actions = [
            SearchResultItem(
                id="admin-act-add-student",
                title="Add New Student Profile",
                subtitle="Create a student account and enrollment record",
                category="action",
                href="/admin/users/students/add",
                icon_type="user-plus",
                badge="Create",
            ),
            SearchResultItem(
                id="admin-act-add-teacher",
                title="Add New Faculty Member",
                subtitle="Create a teacher account and department assignment",
                category="action",
                href="/admin/users/teachers/add",
                icon_type="user-check",
                badge="Create",
            ),
            SearchResultItem(
                id="admin-act-create-class",
                title="Create Academic Class",
                subtitle="Setup a new course section and assign faculty",
                category="action",
                href="/admin/classes/create",
                icon_type="book-plus",
                badge="Create",
            ),
            SearchResultItem(
                id="admin-act-scanner",
                title="Run AI Absentee Scanner",
                subtitle="Detect cross-departmental chronic absentee anomalies",
                category="action",
                href="/admin/scanner",
                icon_type="cpu",
                badge="AI Tool",
            ),
            SearchResultItem(
                id="admin-act-audit",
                title="View System Audit Trail",
                subtitle="Inspect security events, role updates, and auth logs",
                category="action",
                href="/admin/audit",
                icon_type="activity",
                badge="Security",
            ),
            SearchResultItem(
                id="admin-act-settings",
                title="Configure Verification Engine",
                subtitle="Adjust facial match threshold, geofencing, and BLE requirements",
                category="action",
                href="/admin/setup/verification-settings",
                icon_type="shield-check",
                badge="Settings",
            ),
        ]

        if not query:
            return GlobalSearchResponse(
                query=query,
                total_results=len(actions),
                results=actions,
            )

        q_lower = query.lower()

        # Match Admin Actions
        for act in actions:
            if q_lower in act.title.lower() or (act.subtitle and q_lower in act.subtitle.lower()):
                results.append(act)

        # 1. Search Students (Tenant Scoped)
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
            full_name = self._resolve_name(s.firstName, s.lastName)
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

        # 2. Search Faculty / Teachers (Tenant Scoped)
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
            full_name = self._resolve_name(t.firstName, t.lastName)
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

        # 3. Search Academic Classes (Tenant Scoped)
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
            teacher_name = self._resolve_name(c.teacher.firstName, c.teacher.lastName) if c.teacher else "Unassigned"
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

        return GlobalSearchResponse(
            query=query,
            total_results=len(results),
            results=results,
        )
