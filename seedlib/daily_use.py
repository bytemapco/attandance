"""What students, teachers and the admin open day to day: dashboards, notices, consent and reports."""
from seedlib.client import section
from seedlib.context import Ctx

ANNOUNCEMENTS = [
    ("Mid-semester examination timetable published",
     "The mid-semester timetable for all branches is on the notice board and the department pages. Exams start on Monday."),
]
TEACHER_NOTICE = ("DBMS tutorial moved to Wednesday", "The DBMS tutorial for CSE-A and CSE-B is now on Wednesday in Computer Lab 1.")


def _notified(ctx: Ctx, token: str, title: str) -> bool:
    return any(item["title"] == title for item in ctx.api.read("/notifications", token, params={"page_size": 50})["items"])


def notices(ctx: Ctx) -> None:
    api = ctx.api
    section("Notices")
    student = ctx.student_tokens["VIT24CS002"]
    for title, message in ANNOUNCEMENTS:
        if _notified(ctx, student, title):
            api.skip(f"notice: {title}")
            continue
        api.act(f"admin notice: {title}", "POST", "/notifications/broadcast", ctx.admin_token,
                json={"title": title, "message": message, "target_role": "STUDENT", "type": "info", "category": "system"})
    title, message = TEACHER_NOTICE
    if _notified(ctx, student, title):
        api.skip(f"notice: {title}")
    else:
        api.act(f"teacher notice: {title}", "POST", "/notifications/broadcast", ctx.teacher_tokens["VIT-T-1002"],
                json={"title": title, "message": message, "target_role": "STUDENT", "type": "info", "category": "attendance"})
    items = api.read("/notifications", student, params={"page_size": 50})["items"]
    if items:
        api.act("student opens a notice", "PATCH", f"/notifications/{items[0]['id']}/read", student)
    api.act("student marks all read", "PATCH", "/notifications/mark-all-read", student)
    if ctx.fresh and len(items) > 1:
        api.act("student clears an old notice", "DELETE", f"/notifications/{items[-1]['id']}", student)


def students(ctx: Ctx) -> None:
    api = ctx.api
    section("Student app")
    for enrollment, token in list(ctx.student_tokens.items())[:4]:
        for path in ("/student/classes", "/student/subjects", "/student/live-classes", "/student/my-attendance",
                     "/student/stats", "/student/leaderboard", "/student/smart-pass"):
            api.read(path, token)
    if not ctx.fresh:
        return
    for position, (enrollment, token) in enumerate(list(ctx.student_tokens.items())[:6]):
        api.act(f"{enrollment} consents to face recognition", "POST", "/student/biometric/consent", token)
        api.act(f"{enrollment} registers the phone for alerts", "POST", "/student/fcm-token", token,
                json={"token": f"fcm-{enrollment.lower()}-{position:02d}-vit"})
    api.read("/student/biometric/consent-status", ctx.student_tokens["VIT24CS001"])
    api.act("Karthik Reddy withdraws consent", "DELETE", "/student/biometric/consent", ctx.student_tokens["VIT24CS005"])


def teachers(ctx: Ctx) -> None:
    api = ctx.api
    section("Teacher app")
    for token in ctx.teacher_tokens.values():
        for path in ("/faculty/classes", "/faculty/weekly-timetable", "/faculty/history", "/faculty/flagged",
                     "/faculty/analytics", "/teacher/leaves/pending", "/teacher/device-changes/pending"):
            api.read(path, token)


def admin_reports(ctx: Ctx) -> None:
    api, token = ctx.api, ctx.admin_token
    section("Admin reports and directory")
    api.read("/admin/stats", token)
    api.read("/admin/audit", token, params={"page_size": 20})
    api.send("GET", "/admin/audit/export", token)
    api.read("/search", token, params={"q": "Deshpande"})
    api.read("/search", ctx.teacher_tokens["VIT-T-1001"], params={"q": "Data Structures"})
    api.read("/scim/v2/ServiceProviderConfig", token)
    api.read("/scim/v2/Users", token, params={"count": 5})
    api.act("scan for unusual absence patterns", "POST", "/admin/scan-absentees", token)
    api.act("purge attendance photos older than 30 days", "POST", "/admin/biometrics/purge-photos", token, params={"retention_days": 30})
    api.act("mobile app reports a client event", "POST", "/logs", ctx.student_tokens["VIT24CS001"],
            json={"source": "mobile", "level": "INFO", "message": "Smart pass opened", "platform_version": "android-15"})
    api.read("/health")
    if ctx.fresh:
        api.act("complete onboarding checklist", "POST", "/admin/setup/complete", token)
