"""Teachers and students: imported by the admin, then signed in the way each person would sign in."""
from faker import Faker

from seedlib import data
from seedlib.bulk import bulk_import
from seedlib.client import section
from seedlib.context import Ctx, Person

fake = Faker("en_IN")
Faker.seed(2026)


# Yash Agarwal's phone is replaced during seeding; his first sign-in happens after the change is approved.
REPLACED_PHONE = ("VIT22EC004", "android-vit22ec004-galaxy")


def device_for(enrollment: str) -> str:
    if enrollment == REPLACED_PHONE[0]:
        return REPLACED_PHONE[1]
    return f"android-{enrollment.lower()}-pixel"


def _mobile() -> str:
    return fake.numerify("+91 9#########")


def _listing(ctx: Ctx, path: str, key: str) -> dict[str, Person]:
    page = ctx.api.read(path, ctx.admin_token, params={"page_size": 1000})
    return {row[key]: Person(row["id"], row["user_id"], row["email"]) for row in page["items"]}


def teachers(ctx: Ctx) -> None:
    api, token = ctx.api, ctx.admin_token
    section("Teachers")
    known = _listing(ctx, "/admin/users/teachers", "employee_id")
    rows = []
    for t in data.TEACHERS:
        if t["employee_id"] in known:
            api.skip(f"teacher {t['employee_id']}")
            continue
        rows.append({
            "email": data.email_for(t["first"], t["last"]), "employee_id": t["employee_id"],
            "first_name": t["first"], "last_name": t["last"], "name_initials": t["initials"],
            "department_id": ctx.departments[t["department"]], "designation_id": ctx.designations[t["designation"]],
            "phone": _mobile(),
        })
    split = len(data.TEACHERS) - data.SINGLE_CREATE_TEACHERS
    bulk = [r for r in rows if r["employee_id"] in {t["employee_id"] for t in data.TEACHERS[:split]}]
    bulk_import(api, "teachers", "/admin/users/teachers/bulk", token, "teachers",
                [{**r, "password": ctx.password} for r in bulk], send_invite=False)
    for row in rows:
        if row not in bulk:
            api.act(f"teacher {row['employee_id']}", "POST", "/admin/users/teacher", token, json={**row, "send_invite": False})
    ctx.teachers = _listing(ctx, "/admin/users/teachers", "employee_id")


def _student_rows(ctx: Ctx) -> list[tuple[dict, str]]:
    """(row, class code) for every student, in roll order."""
    out = []
    for code, (dept, _letter, _semester, _room, roster) in data.CLASSES.items():
        for s in roster:
            out.append(({
                "email": data.email_for(s["first"], s["last"]), "enrollment_number": s["enrollment"],
                "first_name": s["first"], "last_name": s["last"], "department_id": ctx.departments[dept],
                "gender": s["gender"], "phone": _mobile(),
            }, code))
    return out


def students(ctx: Ctx) -> None:
    api, token = ctx.api, ctx.admin_token
    section("Students")
    known = _listing(ctx, "/admin/users/students", "enrollment_number")
    everyone = _student_rows(ctx)
    single_from = len(everyone) - data.SINGLE_CREATE_STUDENTS
    bulk_rows, single_rows = [], []
    for position, (row, code) in enumerate(everyone):
        if row["enrollment_number"] in known:
            api.skip(f"student {row['enrollment_number']}")
        elif position < single_from:
            bulk_rows.append({**row, "batch_code": code, "password": ctx.password})
        else:
            single_rows.append((row, code))
    bulk_import(api, "students", "/admin/users/students/bulk", token, "students", bulk_rows, send_invite=False)
    for row, code in single_rows:
        body = {k: v for k, v in row.items()}
        body["batch_id"] = ctx.batches[code]
        body["date_of_birth"] = fake.date_of_birth(minimum_age=18, maximum_age=21).isoformat() + "T00:00:00"
        body["send_invite"] = False
        api.act(f"student {row['enrollment_number']}", "POST", "/admin/users/student", token, json=body)
    ctx.students = _listing(ctx, "/admin/users/students", "enrollment_number")


def revisions(ctx: Ctx) -> None:
    """Contact details corrected after onboarding, then the usual directory lookups. Runs once for a new institution."""
    if not ctx.fresh:
        return
    api, token = ctx.api, ctx.admin_token
    teacher = ctx.teachers["VIT-T-1003"]
    api.read(f"/admin/users/teachers/{teacher.id}", token)
    api.act("update Meenakshi Iyer's phone", "PUT", f"/admin/users/teachers/{teacher.id}", token, json={"phone": _mobile()})
    student = ctx.students["VIT24CS003"]
    api.read(f"/admin/users/students/{student.id}", token)
    api.act("update Rohan Patil's phone", "PUT", f"/admin/users/students/{student.id}", token, json={"phone": _mobile()})
    api.read("/admin/users/students/facets", token)
    api.read("/admin/users/students", token, params={"semester": 3, "q": "Patil"})
    api.read("/admin/users/teachers", token, params={"q": "Kulkarni", "sort_by": "first_name"})


def sign_in(ctx: Ctx) -> None:
    """Everyone created with a known password signs in. Accounts from the single-create endpoint get a temporary
    password by e-mail, so they cannot sign in here."""
    section("Sign in")
    api = ctx.api
    for t in data.TEACHERS[: len(data.TEACHERS) - data.SINGLE_CREATE_TEACHERS]:
        token = api.login(ctx.teachers[t["employee_id"]].email, ctx.password)
        if token:
            ctx.teacher_tokens[t["employee_id"]] = token
    roster = [s for entry in data.CLASSES.values() for s in entry[4]]
    for s in roster[: len(roster) - data.SINGLE_CREATE_STUDENTS]:
        if s["enrollment"] == REPLACED_PHONE[0]:
            continue
        email = ctx.students[s["enrollment"]].email
        token = api.login(email, ctx.password, device_uuid=device_for(s["enrollment"]), tenant_slug=data.TENANT_SLUG)
        if token:
            ctx.student_tokens[s["enrollment"]] = token
    api.read("/auth/me", ctx.admin_token)
    api.read("/auth/config", ctx.admin_token)
    api.read("/auth/verify-token", params={"token": ctx.admin_token})
