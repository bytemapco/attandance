"""Platform side: the super admin provisions the institution and handles its licence requests."""
from seedlib import data
from seedlib.client import section
from seedlib.context import Ctx

GLOBAL_NOTICE_TITLE = "Scheduled maintenance this Sunday"


def _find_tenant(ctx: Ctx) -> dict | None:
    page = ctx.api.read("/super-admin/tenants", ctx.super_token, params={"q": data.TENANT_SLUG})
    return next((t for t in page["items"] if t["slug"] == data.TENANT_SLUG), None)


def provision_tenant(ctx: Ctx) -> None:
    api = ctx.api
    section("Platform: super admin")
    token = api.login(ctx.super_email, ctx.super_password)
    if not token:
        raise SystemExit("Super admin login failed. Pass --super-email and --super-password.")
    ctx.super_token = token
    api.read("/super-admin/stats", token)
    api.read("/super-admin/system-health", token)

    tenant = _find_tenant(ctx)
    if tenant:
        api.skip(f"institution {data.TENANT_NAME}")
    else:
        tenant = api.act(
            f"provision institution {data.TENANT_NAME}", "POST", "/super-admin/tenants", token,
            json={
                "name": data.TENANT_NAME, "slug": data.TENANT_SLUG, "license_count": data.LICENSE_SEATS,
                "admin_password": ctx.password, "admins": data.ADMINS,
            },
        )
        if not tenant:
            raise SystemExit("Could not provision the institution; nothing else can be seeded.")
        ctx.fresh = True
    ctx.tenant_id = tenant["id"]
    api.read(f"/super-admin/tenants/{ctx.tenant_id}", token)

    admin_token = api.login(data.ADMINS[0]["email"], ctx.password)
    if not admin_token:
        raise SystemExit("Institution admin login failed; the existing institution uses another password.")
    ctx.admin_token = admin_token


def tenant_admin_lifecycle(ctx: Ctx) -> None:
    """A third administrator joins, changes e-mail and leaves. Runs once, when the institution is new."""
    if not ctx.fresh:
        return
    api, token, tid = ctx.api, ctx.super_token, ctx.tenant_id
    added = api.act(
        "add administrator Sunita Rane", "POST", f"/super-admin/tenants/{tid}/admins", token,
        json={"name": "Sunita Rane", "email": data.email_for("sunita", "rane"), "role": "ADMIN"},
    )
    admin_id = (added or {}).get("id") or ((added or {}).get("admin") or {}).get("id")
    if not admin_id:
        return
    api.act(
        "correct Sunita Rane's e-mail", "PUT", f"/super-admin/tenants/{tid}/admins/{admin_id}", token,
        json={"email": data.email_for("sunita", "rane.accounts")},
    )
    api.act("remove Sunita Rane", "DELETE", f"/super-admin/tenants/{tid}/admins/{admin_id}", token)


def sandbox_tenant(ctx: Ctx) -> None:
    """A trial institution is created, put on hold and deleted. Runs once, when the institution is new."""
    if not ctx.fresh:
        return
    api, token = ctx.api, ctx.super_token
    sandbox = api.act(
        "provision trial institution", "POST", "/super-admin/tenants", token,
        json={
            "name": "Shivneri Polytechnic (trial)", "slug": "shivneri-trial", "license_count": 10,
            "admin_name": "Ganesh Pawar", "admin_email": data.email_for("ganesh", "pawar"),
            "admin_password": ctx.password,
        },
    )
    if not sandbox:
        return
    api.act("suspend trial institution", "PUT", f"/super-admin/tenants/{sandbox['id']}", token, json={"status": "SUSPENDED"})
    api.act("delete trial institution", "DELETE", f"/super-admin/tenants/{sandbox['id']}", token)


def licence_request(ctx: Ctx) -> None:
    """The college asks for more seats once its roll is full; the super admin approves."""
    if not ctx.fresh:
        return
    api = ctx.api
    section("Licences")
    api.read("/admin/licenses", ctx.admin_token)
    request = api.act(
        "request more seats", "POST", "/admin/licenses/request", ctx.admin_token,
        json={"requested_count": data.EXTRA_LICENSE_SEATS},
    )
    api.read("/admin/licenses/requests", ctx.admin_token)
    api.read("/super-admin/license-requests", ctx.super_token, params={"status": "PENDING"})
    if request:
        api.act(
            "approve seat request", "POST", f"/super-admin/license-requests/{request['id']}/process",
            ctx.super_token, json={"approve": True},
        )
    api.read("/admin/licenses", ctx.admin_token)


def platform_overview(ctx: Ctx) -> None:
    """Read-only dashboards plus one platform-wide notice."""
    api, token = ctx.api, ctx.super_token
    section("Platform: audit, users, notices")
    api.read("/super-admin/users", token, params={"tenant_id": ctx.tenant_id, "role": "TEACHER"})
    api.read("/super-admin/audit-logs", token, params={"tenant_id": ctx.tenant_id})
    api.read("/super-admin/audit-logs/event-types", token)
    history = api.read("/super-admin/broadcasts", token)
    if any(item["title"] == GLOBAL_NOTICE_TITLE for item in history["items"]):
        api.skip("platform notice")
        return
    api.act(
        "send platform notice", "POST", "/super-admin/broadcast", token,
        json={
            "title": GLOBAL_NOTICE_TITLE,
            "message": "SAHAJ will be unavailable between 2:00 and 3:00 AM IST on Sunday for a database upgrade.",
            "target_role": "ALL", "type": "warning", "category": "maintenance",
        },
    )
