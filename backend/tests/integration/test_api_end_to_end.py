"""The real application over HTTP, against a real PostgreSQL and Redis: login, roles, tenant isolation, logout."""
import os

import pytest
import redis as redis_sync

from tests.integration.institution import LOGIN, PASSWORD, Institution


@pytest.fixture
def college_a(seed):
    return Institution(seed)


@pytest.fixture
def college_b(seed):
    return Institution(seed)


def test_the_health_check_reports_every_dependency(client):
    body = client.get("/health").json()

    assert body["status"] == "healthy"
    assert body["services"]["database"]["status"] == "healthy"
    assert body["services"]["redis"]["status"] == "healthy"


def test_signing_in_gives_a_token_that_identifies_the_user(client, college_a):
    headers = college_a.sign_in(client)

    me = client.get("/api/v1/auth/me", headers=headers)

    assert me.status_code == 200 and me.json()["email"] == college_a.email


def test_a_wrong_password_is_refused(client, college_a):
    response = client.post(LOGIN, json={"email": college_a.email, "password": "Wrong-Pass-1"}, headers=college_a.headers)
    assert response.status_code == 401


def test_five_wrong_passwords_lock_the_account_even_for_the_right_one(client, college_a):
    body = {"email": college_a.email, "tenant_slug": college_a.slug}
    for _ in range(5):
        client.post(LOGIN, json={**body, "password": "Wrong-Pass-1"}, headers=college_a.headers)

    locked = client.post(LOGIN, json={**body, "password": PASSWORD}, headers=college_a.headers)

    assert locked.status_code == 429


def test_requests_without_a_token_are_refused(client, college_a):
    assert client.get("/api/v1/admin/departments", headers=college_a.headers).status_code == 401


def test_a_forged_token_is_refused(client, college_a):
    headers = {**college_a.headers, "Authorization": "Bearer not.a.token"}
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401


def test_a_teacher_cannot_use_admin_endpoints(client, seed):
    teacher = Institution(seed, role="TEACHER")
    assert client.get("/api/v1/admin/departments", headers=teacher.sign_in(client)).status_code == 403


def test_an_admin_manages_their_own_departments(client, college_a):
    headers = college_a.sign_in(client)

    created = client.post("/api/v1/admin/departments", json={"name": "Civil Engineering", "code": "CIV"}, headers=headers)
    listing = client.get("/api/v1/admin/departments", headers=headers)

    assert created.status_code == 200, created.text
    assert [d["code"] for d in listing.json()] == ["CIV"]


def test_one_institution_never_sees_anothers_departments(client, college_a, college_b):
    headers_a, headers_b = college_a.sign_in(client), college_b.sign_in(client)
    created = client.post("/api/v1/admin/departments", json={"name": "Physics Dept", "code": "PHY"}, headers=headers_a)
    department_id = created.json()["id"]

    assert client.get("/api/v1/admin/departments", headers=headers_b).json() == []
    assert client.get(f"/api/v1/admin/departments/{department_id}", headers=headers_b).status_code == 404
    assert client.get(f"/api/v1/admin/departments/{department_id}", headers=headers_a).status_code == 200


def test_the_same_department_code_can_exist_in_two_institutions(client, college_a, college_b):
    body = {"name": "Mechanical", "code": "ME"}

    assert client.post("/api/v1/admin/departments", json=body, headers=college_a.sign_in(client)).status_code == 200
    assert client.post("/api/v1/admin/departments", json=body, headers=college_b.sign_in(client)).status_code == 200


def test_a_duplicate_code_in_one_institution_is_a_409(client, college_a):
    headers = college_a.sign_in(client)
    body = {"name": "Mechanical", "code": "ME"}
    client.post("/api/v1/admin/departments", json=body, headers=headers)

    assert client.post("/api/v1/admin/departments", json=body, headers=headers).status_code == 409


def test_a_token_cannot_be_used_under_another_institutions_name(client, college_a, college_b):
    headers = {**college_a.sign_in(client), "X-Tenant-ID": college_b.tenant_id}

    response = client.get("/api/v1/admin/departments", headers=headers)

    assert response.status_code == 403


def test_logging_out_makes_the_token_useless(client, college_a):
    headers = college_a.sign_in(client)
    assert client.get("/api/v1/auth/me", headers=headers).status_code == 200

    assert client.post("/api/v1/auth/logout", headers=headers).status_code == 200

    assert client.get("/api/v1/auth/me", headers=headers).status_code == 401


def test_a_suspended_institution_is_locked_out_at_once(client, college_a, conn):
    headers = college_a.sign_in(client)
    with conn.cursor() as cursor:
        cursor.execute("UPDATE tenants SET status = 'SUSPENDED' WHERE id = %s", (college_a.tenant_id,))
    redis_sync.Redis.from_url(os.environ["TEST_REDIS_URL"]).flushdb()

    response = client.get("/api/v1/admin/departments", headers=headers)

    assert response.status_code == 403
