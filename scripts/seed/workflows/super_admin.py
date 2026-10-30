from typing import Any
from scripts.seed.client import ApiClient


async def login_super_admin(client: ApiClient, email: str, password: str) -> str:
    print(f"\n[SuperAdmin] Authenticating {email}...")
    resp = await client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    token = resp["access_token"]
    client.set_auth(token=token, tenant_id=None)
    print("  ✓ Super Admin logged in successfully.")
    return token


async def setup_tenants(
    client: ApiClient,
    institutions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    print("\n[SuperAdmin] Provisioning institutional tenants...")
    provisioned_tenants = []

    existing_tenants_resp = await client.get("/super-admin/tenants?page_size=100")
    existing_items = existing_tenants_resp.get("items", [])
    existing_slugs = {t["slug"]: t for t in existing_items}

    for inst in institutions:
        slug = inst["slug"]
        admin_email = f"admin.{slug.replace('-', '')}@yopmail.com"
        admin_password = "Admin@123456"

        if slug in existing_slugs:
            tenant_info = existing_slugs[slug]
            print(f"  • Tenant '{inst['name']}' already exists ({tenant_info['id']}).")
            details = await client.get(f"/super-admin/tenants/{tenant_info['id']}")
            actual_admin_email = admin_email
            if details.get("admin_users") and len(details["admin_users"]) > 0:
                actual_admin_email = details["admin_users"][0]["email"]

            provisioned_tenants.append({
                "id": tenant_info["id"],
                "name": inst["name"],
                "slug": slug,
                "admin_email": actual_admin_email,
                "admin_password": admin_password,
                "lat": inst["lat"],
                "lon": inst["lon"],
            })
            continue

        payload = {
            "name": inst["name"],
            "slug": slug,
            "type": inst.get("type", "COLLEGE"),
            "domain": inst.get("domain"),
            "license_count": 600,
            "admin_name": f"Head Admin ({slug.upper()})",
            "admin_email": admin_email,
            "admin_password": admin_password,
            "config": {
                "isFaceRecognitionEnabled": True,
                "isGpsVerificationEnabled": True,
                "isAiBackgroundValidationEnabled": True,
                "geofenceRadiusMeters": 100,
            },
        }

        created = await client.post("/super-admin/tenants", json=payload)
        print(f"  ✓ Provisioned tenant: {created['name']} (ID: {created['id']})")
        provisioned_tenants.append({
            "id": created["id"],
            "name": created["name"],
            "slug": slug,
            "admin_email": admin_email,
            "admin_password": admin_password,
            "lat": inst["lat"],
            "lon": inst["lon"],
        })

    # Post an institutional platform broadcast
    try:
        await client.post(
            "/super-admin/broadcast",
            json={
                "title": "Smart Attendance Academic System Active",
                "message": "All faculty and students please register biometrics and adhere to lecture hall geofencing.",
                "category": "system",
            },
        )
        print("  ✓ Platform announcement broadcasted.")
    except Exception as exc:
        print(f"  ⚠ Notice: Broadcast skipped ({exc})")

    return provisioned_tenants
