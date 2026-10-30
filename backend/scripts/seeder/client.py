"""HTTP API Client Wrapper for Seeder Operations."""

from typing import Any, Dict, Optional
import httpx


class APIClient:
    def __init__(self, base_url: str, timeout: float = 30.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.token: Optional[str] = None
        self.tenant_id: Optional[str] = None
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self) -> "APIClient":
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            follow_redirects=True,
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if self._client:
            await self._client.aclose()

    def set_token(self, token: Optional[str]) -> None:
        self.token = token

    def set_tenant_id(self, tenant_id: Optional[str]) -> None:
        self.tenant_id = tenant_id

    def _build_headers(
        self, custom: Optional[Dict[str, str]] = None, is_json: bool = True
    ) -> Dict[str, str]:
        headers: Dict[str, str] = {"Accept": "application/json"}
        if is_json:
            headers["Content-Type"] = "application/json"
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        if self.tenant_id:
            headers["X-Tenant-ID"] = self.tenant_id
        if custom:
            headers.update(custom)
        return headers

    async def get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Any:
        client = self._ensure_client()
        headers = self._build_headers()
        response = await client.get(path, headers=headers, params=params)
        return self._handle_response(response, "GET", path)

    async def post(
        self,
        path: str,
        json_data: Optional[Any] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> Any:
        client = self._ensure_client()
        headers = self._build_headers(is_json=(data is None))
        response = await client.post(path, headers=headers, json=json_data, data=data)
        return self._handle_response(response, "POST", path)

    async def put(self, path: str, json_data: Optional[Any] = None) -> Any:
        client = self._ensure_client()
        headers = self._build_headers()
        response = await client.put(path, headers=headers, json=json_data)
        return self._handle_response(response, "PUT", path)

    async def patch(self, path: str, json_data: Optional[Any] = None) -> Any:
        client = self._ensure_client()
        headers = self._build_headers()
        response = await client.patch(path, headers=headers, json=json_data)
        return self._handle_response(response, "PATCH", path)

    async def delete(self, path: str) -> Any:
        client = self._ensure_client()
        headers = self._build_headers()
        response = await client.delete(path, headers=headers)
        return self._handle_response(response, "DELETE", path)

    def _ensure_client(self) -> httpx.AsyncClient:
        if not self._client:
            raise RuntimeError("APIClient must be used inside an async context manager.")
        return self._client

    @staticmethod
    def _handle_response(response: httpx.Response, method: str, path: str) -> Any:
        if 200 <= response.status_code < 300:
            if not response.content:
                return {}
            return response.json()

        detail = response.text
        try:
            err_json = response.json()
            if isinstance(err_json, dict):
                detail = err_json.get("detail") or err_json.get("error", {}).get("message") or str(err_json)
        except Exception:
            pass

        raise RuntimeError(
            f"API request failed [{response.status_code}] {method} {path}: {detail}"
        )
