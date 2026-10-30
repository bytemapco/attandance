import asyncio
from typing import Any, Optional
import httpx


class ApiClient:
    def __init__(self, base_url: str, timeout: float = 30.0, max_retries: int = 5):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries
        self.client = httpx.AsyncClient(timeout=timeout)
        self.token: Optional[str] = None
        self.tenant_id: Optional[str] = None

    async def close(self) -> None:
        await self.client.aclose()

    def set_auth(self, token: Optional[str] = None, tenant_id: Optional[str] = None) -> None:
        self.token = token
        if tenant_id is not None:
            self.tenant_id = tenant_id

    def _build_headers(self, custom_headers: Optional[dict[str, str]] = None) -> dict[str, str]:
        headers: dict[str, str] = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if self.tenant_id:
            headers["X-Tenant-ID"] = self.tenant_id
        if custom_headers:
            headers.update(custom_headers)
        return headers

    async def request(
        self,
        method: str,
        path: str,
        json: Optional[Any] = None,
        data: Optional[Any] = None,
        files: Optional[Any] = None,
        params: Optional[dict[str, Any]] = None,
        headers: Optional[dict[str, str]] = None,
    ) -> httpx.Response:
        url = f"{self.base_url}/{path.lstrip('/')}"
        req_headers = self._build_headers(headers)

        for attempt in range(1, self.max_retries + 1):
            try:
                response = await self.client.request(
                    method=method,
                    url=url,
                    json=json,
                    data=data,
                    files=files,
                    params=params,
                    headers=req_headers,
                )
                if response.status_code == 429:
                    wait_time = 10.0 * attempt
                    print(f"  [RateLimit 429] on {method} {path}. Backing off {wait_time:.1f}s...")
                    await asyncio.sleep(wait_time)
                    continue

                return response
            except (httpx.ConnectError, httpx.ReadTimeout) as err:
                if attempt == self.max_retries:
                    raise err
                await asyncio.sleep(1.0 * attempt)

        return response

    async def get(self, path: str, params: Optional[dict[str, Any]] = None) -> dict[str, Any]:
        resp = await self.request("GET", path, params=params)
        resp.raise_for_status()
        return resp.json()

    async def post(
        self,
        path: str,
        json: Optional[Any] = None,
        data: Optional[Any] = None,
        files: Optional[Any] = None,
    ) -> dict[str, Any]:
        resp = await self.request("POST", path, json=json, data=data, files=files)
        resp.raise_for_status()
        return resp.json()

    async def put(self, path: str, json: Optional[Any] = None, data: Optional[Any] = None) -> dict[str, Any]:
        resp = await self.request("PUT", path, json=json, data=data)
        resp.raise_for_status()
        return resp.json()

    async def patch(self, path: str, json: Optional[Any] = None) -> dict[str, Any]:
        resp = await self.request("PATCH", path, json=json)
        resp.raise_for_status()
        return resp.json()
