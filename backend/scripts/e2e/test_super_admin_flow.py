"""E2E Test Flow: Super Admin operations and monitoring."""

from typing import Any, Dict
from .e2e_client import E2EClient


async def test_super_admin_flow(client: E2EClient) -> Dict[str, Any]:
    print("\n--- [E2E] 1. SUPER ADMIN FLOW ---")

    # 1. Login
    login_data = await client.login("superadmin@attendance.system", "SuperAdmin@123456")
    assert login_data["role"] == "SUPER_ADMIN", "Role must be SUPER_ADMIN"
    print("  ✓ Super Admin logged in successfully")

    # 2. Verify /auth/me
    me_res = await client.get("/auth/me")
    assert me_res.status_code == 200, f"/auth/me failed: {me_res.text}"
    assert me_res.json()["role"] == "SUPER_ADMIN"
    print("  ✓ /auth/me verified for Super Admin")

    # 3. List Institutions / Tenants
    tenants_res = await client.get("/super-admin/tenants")
    assert tenants_res.status_code == 200, f"Failed listing tenants: {tenants_res.text}"
    tenants_data = tenants_res.json()
    tenants = tenants_data.get("items", tenants_data) if isinstance(tenants_data, dict) else tenants_data
    assert len(tenants) >= 1, "At least one tenant should exist"
    tenant_id = tenants[0]["id"]
    print(f"  ✓ Found {len(tenants)} tenant(s). Primary: {tenants[0]['name']}")

    # 4. Get Single Tenant Detail
    tenant_res = await client.get(f"/super-admin/tenants/{tenant_id}")
    assert tenant_res.status_code == 200, f"Failed fetching tenant {tenant_id}: {tenant_res.text}"
    print(f"  ✓ Fetched tenant details for {tenant_res.json()['name']}")

    # 5. System Health & Infrastructure Services
    health_res = await client.get("/super-admin/system-health")
    assert health_res.status_code == 200, f"System health check failed: {health_res.text}"
    stats_res = await client.get("/super-admin/stats")
    assert stats_res.status_code == 200, f"System stats failed: {stats_res.text}"
    print("  ✓ System health & platform stats verified")

    # 6. Global Broadcast Notification
    broadcast_payload = {
        "title": "E2E Automated Verification Test",
        "message": "System integrity check executed by automated suite.",
        "type": "info",
        "category": "system",
        "target_role": "ALL",
    }
    broadcast_res = await client.post("/super-admin/broadcast", json=broadcast_payload)
    assert broadcast_res.status_code in [200, 201], f"Broadcast failed: {broadcast_res.text}"
    print("  ✓ Broadcast notification issued successfully")

    # 7. Audit Logs
    audit_res = await client.get("/super-admin/audit-logs")
    assert audit_res.status_code == 200, f"Audit logs failed: {audit_res.text}"
    print(f"  ✓ Audit logs accessible (retrieved {len(audit_res.json())} entries)")

    return {"tenant_id": tenant_id, "tenant_slug": tenants[0]["slug"]}
