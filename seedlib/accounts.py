"""Account housekeeping a new institution goes through in its first days. Runs once, when the institution is new."""
from seedlib import data
from seedlib.client import section
from seedlib.context import Ctx

NEW_PASSWORD = "Sahaj@2027"


def run(ctx: Ctx) -> None:
    if not ctx.fresh:
        return
    api = ctx.api
    section("Account housekeeping")
    riya = ctx.students["VIT24CS012"]
    token = ctx.student_tokens["VIT24CS012"]
    api.act("Riya changes her password", "POST", "/auth/change-password", token,
            json={"current_password": ctx.password, "new_password": NEW_PASSWORD})
    api.act("Riya goes back to the shared demo password", "POST", "/auth/change-password", token,
            json={"current_password": NEW_PASSWORD, "new_password": ctx.password})
    _session_cycle(ctx, riya.email)
    api.act("Riya asks for a password reset link", "POST", "/auth/forgot-password", json={"email": riya.email})
    teacher = ctx.teachers["VIT-T-1005"]
    api.act("admin sends Pooja Bhandari a reset link", "POST", f"/admin/users/{teacher.user_id}/reset-password", ctx.admin_token)
    _suspend_and_restore(ctx, ctx.students["VIT24CS013"].user_id)
    _directory_sync(ctx)


def _session_cycle(ctx: Ctx, email: str) -> None:
    api = ctx.api
    response = api.send("POST", "/auth/login", json={
        "email": email, "password": ctx.password, "tenant_slug": data.TENANT_SLUG,
        "device_uuid": "android-vit24cs012-pixel",
    })
    if response.status_code != 200:
        api.fail("second session for Riya", f"{response.status_code}: {response.text[:200]}")
        return
    session = response.json()
    refreshed = api.act("session refreshed", "POST", "/auth/refresh", json={"refresh_token": session["refresh_token"]})
    if refreshed:
        api.act("Riya logs out", "POST", "/auth/logout", refreshed["access_token"])


def _suspend_and_restore(ctx: Ctx, user_id: str) -> None:
    api = ctx.api
    api.act("super admin deactivates Siddharth Menon", "PATCH", f"/super-admin/users/{user_id}/status", ctx.super_token,
            json={"is_active": False})
    api.act("super admin reactivates Siddharth Menon", "PATCH", f"/super-admin/users/{user_id}/status", ctx.super_token,
            json={"is_active": True})


def _directory_sync(ctx: Ctx) -> None:
    """The college's identity provider pushes a visiting examiner through SCIM, then removes the account."""
    api, token = ctx.api, ctx.admin_token
    created = api.act(
        "directory sync adds a visiting examiner", "POST", "/scim/v2/Users", token,
        json={"userName": data.email_for("sandeep", "bapat"), "active": True, "roles": [{"value": "TEACHER"}]},
    )
    if not created:
        return
    api.read(f"/scim/v2/Users/{created['id']}", token)
    api.act("directory sync removes the examiner", "DELETE", f"/scim/v2/Users/{created['id']}", token)
