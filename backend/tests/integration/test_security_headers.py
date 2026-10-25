import pytest


@pytest.mark.integration
async def test_security_headers_present_on_all_responses(async_client):
    response = await async_client.get("/health")
    assert response.status_code in (200, 503)

    headers = response.headers
    assert "strict-transport-security" in headers
    assert "max-age=63072000" in headers["strict-transport-security"]
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "0"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=(self)" in headers.get("permissions-policy", "")
    assert "default-src 'self'" in headers.get("content-security-policy", "")


@pytest.mark.integration
async def test_docs_security_headers_custom_csp(async_client):
    response = await async_client.get("/docs")
    headers = response.headers
    assert "content-security-policy" in headers
    csp = headers["content-security-policy"]
    assert "https://cdn.jsdelivr.net" in csp
