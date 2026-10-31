"""HTTP Client helper for End-to-End flow testing."""

from typing import Any, Dict, Optional
import httpx

BASE_URL = "http://localhost:8000/api/v1"


class E2EClient:
    def __init__(self, base_url: str = BASE_URL) -> None:
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)
        self.token: Optional[str] = None
        self.tenant_id: Optional[str] = None

    async def __aenter__(self) -> "E2EClient":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.client.aclose()

    def set_auth(self, token: str, tenant_id: Optional[str] = None) -> None:
        self.token = token
        self.tenant_id = tenant_id

    def clear_auth(self) -> None:
        self.token = None
        self.tenant_id = None

    def _headers(self, extra_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        headers: Dict[str, str] = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if self.tenant_id:
            headers["X-Tenant-ID"] = self.tenant_id
        if extra_headers:
            headers.update(extra_headers)
        return headers

    async def get(self, path: str, extra_headers: Optional[Dict[str, str]] = None) -> httpx.Response:
        return await self.client.get(path, headers=self._headers(extra_headers))

    async def post(
        self, path: str, json: Optional[Any] = None, extra_headers: Optional[Dict[str, str]] = None
    ) -> httpx.Response:
        return await self.client.post(path, json=json, headers=self._headers(extra_headers))

    async def put(
        self, path: str, json: Optional[Any] = None, extra_headers: Optional[Dict[str, str]] = None
    ) -> httpx.Response:
        return await self.client.put(path, json=json, headers=self._headers(extra_headers))

    async def delete(self, path: str, extra_headers: Optional[Dict[str, str]] = None) -> httpx.Response:
        return await self.client.delete(path, headers=self._headers(extra_headers))

    async def login(
        self, email: str, password: str, device_uuid: Optional[str] = None
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"email": email, "password": password}
        if device_uuid:
            payload["device_uuid"] = device_uuid
        res = await self.client.post("/auth/login", json=payload)
        if res.status_code != 200:
            raise RuntimeError(f"Login failed for {email} [{res.status_code}]: {res.text}")
        data = res.json()
        self.set_auth(data["access_token"], data.get("tenant_id"))
        return data
