"""An institution with one signed-in admin, for the tests that call the real API."""
import asyncio
import uuid

from app.core.security import hash_password

PASSWORD = "Correct-Horse-9"
LOGIN = "/api/v1/auth/login"


class Institution:
    def __init__(self, seed, role="TENANT_ADMIN"):
        self.tenant_id = seed.tenant()
        with seed.conn.cursor() as cursor:
            cursor.execute("SELECT slug FROM tenants WHERE id = %s", (self.tenant_id,))
            self.slug = cursor.fetchone()[0]
        self.email = f"{uuid.uuid4().hex[:10]}@example.com"
        seed.insert(
            "users", email=self.email, hashed_password=asyncio.run(hash_password(PASSWORD)),
            tenant_id=self.tenant_id, role=role,
        )

    @property
    def headers(self):
        return {"X-Tenant-ID": self.slug}

    def sign_in(self, client) -> dict:
        response = client.post(LOGIN, json={"email": self.email, "password": PASSWORD}, headers=self.headers)
        assert response.status_code == 200, response.text
        # The token names the tenant by id, so a signed-in client sends the id, as the web app does.
        return {"X-Tenant-ID": self.tenant_id, "Authorization": f"Bearer {response.json()['access_token']}"}
