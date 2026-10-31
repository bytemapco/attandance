"""E2E Test Flow: Security boundaries, role-based access control (RBAC), and token lifecycle."""

from typing import Any, Dict
from .e2e_client import E2EClient


async def test_security_boundaries(client: E2EClient, context: Dict[str, Any]) -> None:
    print("\n--- [E2E] 5. SECURITY BOUNDARIES & RBAC ENFORCEMENT ---")

    # 1. Unauthenticated Access Rejection
    client.clear_auth()
    res = await client.get("/super-admin/tenants")
    assert res.status_code == 401, f"Expected 401 for unauth super-admin access, got {res.status_code}"

    tenant_id = context.get("tenant_id")
    tenant_header = {"X-Tenant-ID": tenant_id} if tenant_id else None

    res = await client.get("/admin/users/teachers", extra_headers=tenant_header)
    assert res.status_code == 401, f"Expected 401 for unauth admin access, got {res.status_code}"

    res = await client.get("/teacher/my-classes", extra_headers=tenant_header)
    assert res.status_code == 401, f"Expected 401 for unauth teacher access, got {res.status_code}"
    print("  ✓ Unauthenticated access correctly rejected with 401 across all protected routes")

    # 2. Student Role Escalation Rejection (Student -> Admin / Super Admin)
    student_token_data = await client.login(
        "aarav.sharma@yopmail.com", "Student@Secure123!", device_uuid="dev-hw-uuid-oneplus12r-in-99"
    )
    res = await client.get("/super-admin/tenants")
    assert res.status_code == 403, f"Expected 403 when Student accesses super-admin, got {res.status_code}"

    res = await client.get("/admin/users/teachers")
    assert res.status_code == 403, f"Expected 403 when Student accesses tenant admin, got {res.status_code}"
    print("  ✓ Privilege escalation prevented: Student access to Admin/Super Admin blocked with 403")

    # 3. Teacher Role Boundary Rejection (Teacher -> Super Admin)
    await client.login("rajesh.kulkarni@yopmail.com", "Teacher@Secure123!")
    res = await client.get("/super-admin/tenants")
    assert res.status_code == 403, f"Expected 403 when Teacher accesses super-admin, got {res.status_code}"
    print("  ✓ Privilege escalation prevented: Teacher access to Super Admin blocked with 403")

    # 4. Token Refresh Lifecycle
    refresh_token = student_token_data.get("refresh_token")
    if refresh_token:
        refresh_payload = {"refresh_token": refresh_token}
        ref_res = await client.client.post("/auth/refresh", json=refresh_payload)
        assert ref_res.status_code == 200, f"Token refresh failed: {ref_res.text}"
        new_token_data = ref_res.json()
        assert "access_token" in new_token_data, "Refreshed token missing access_token"
        print("  ✓ Token refresh flow executed and verified")

    # 5. Invalid Credentials Rejection
    client.clear_auth()
    bad_login_res = await client.client.post(
        "/auth/login", json={"email": "superadmin@attendance.system", "password": "WrongPassword999!"}
    )
    assert bad_login_res.status_code == 401, f"Expected 401 on bad password, got {bad_login_res.status_code}"
    print("  ✓ Bad credential attempt safely rejected with 401")
