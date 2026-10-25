import pytest


@pytest.mark.integration
async def test_cross_tenant_spoofing_blocked(async_client, create_test_token):
    token = create_test_token(user_id="student-1", role="STUDENT", tenant_id="tenant-alpha")
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": "tenant-beta",  # Mismatch!
    }

    response = await async_client.get("/api/v1/student/profile", headers=headers)
    assert response.status_code == 403
    data = response.json()
    assert "Cross-tenant context manipulation detected" in data.get("detail", "")


@pytest.mark.integration
async def test_tenant_context_matching_permitted(async_client, create_test_token, mock_db):
    token = create_test_token(user_id="student-1", role="STUDENT", tenant_id="tenant-alpha")
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": "tenant-alpha",
    }

    # Should pass through tenant middleware and reach route dependency (which checks user)
    response = await async_client.get("/api/v1/student/profile", headers=headers)
    # Status is not 403 Cross-tenant manipulation (it will be 401/404 based on mock user)
    assert response.status_code != 403


@pytest.mark.integration
async def test_exempt_paths_do_not_require_tenant(async_client):
    response = await async_client.get("/health")
    assert response.status_code in (200, 503)

    auth_doc_response = await async_client.get("/docs")
    assert auth_doc_response.status_code == 200


@pytest.mark.integration
async def test_strict_tenant_check_missing_returns_400(async_client):
    headers = {
        "X-Strict-Tenant-Check": "true",
    }
    response = await async_client.get("/api/v1/search", headers=headers)
    assert response.status_code == 400
    data = response.json()
    assert "Tenant context missing" in data.get("detail", "")
