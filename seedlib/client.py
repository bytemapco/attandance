"""HTTP client and result tally shared by every seed step."""
import sys
import time
from dataclasses import dataclass, field
from typing import Any

import httpx

MAX_RATE_LIMIT_RETRIES = 6


@dataclass
class Tally:
    created: int = 0
    skipped: int = 0
    failed: int = 0
    failures: list[str] = field(default_factory=list)


class Api:
    """Every seed write goes through here, so validation and business rules run exactly as for real clients."""

    def __init__(self, base_url: str, tally: Tally) -> None:
        self.root = base_url.rstrip("/")
        self.tally = tally
        self.http = httpx.Client(timeout=90)

    def send(self, method: str, path: str, token: str | None = None, **kwargs: Any) -> httpx.Response:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        for attempt in range(MAX_RATE_LIMIT_RETRIES):
            response = self.http.request(method, f"{self.root}{path}", headers=headers, **kwargs)
            if response.status_code != 429:
                return response
            time.sleep(min(5 * (attempt + 1), 30))
        return response

    def read(self, path: str, token: str | None = None, **kwargs: Any) -> Any:
        """GET that must succeed. Reads are not counted in the summary."""
        response = self.send("GET", path, token, **kwargs)
        if response.status_code != 200:
            raise RuntimeError(f"GET {path} -> {response.status_code}: {response.text[:300]}")
        return response.json()

    def act(
        self, label: str, method: str, path: str, token: str | None = None, *, quiet: bool = False, **kwargs: Any
    ) -> Any | None:
        """A write. Counts as created on 2xx and failed otherwise; returns the JSON body or None.
        `quiet` skips the progress line, for loops that print their own summary."""
        response = self.send(method, path, token, **kwargs)
        if response.status_code >= 400:
            self.fail(label, f"{method} {path} -> {response.status_code}: {response.text[:240]}")
            return None
        self.tally.created += 1
        if not quiet:
            log(f"  + {label}")
        if response.status_code == 204 or not response.content:
            return {}
        return response.json()

    def expect_rejection(self, label: str, method: str, path: str, status: int, token: str | None = None, **kwargs: Any) -> None:
        """A call the business rules must refuse. A refusal counts as done, an acceptance as a failure."""
        response = self.send(method, path, token, **kwargs)
        if response.status_code == status:
            self.tally.created += 1
            log(f"  + {label} (refused with {status} as expected)")
            return
        self.fail(label, f"{method} {path} expected {status}, got {response.status_code}: {response.text[:200]}")

    def note(self, message: str) -> None:
        """Prints a line without touching the tally."""
        log(f"  + {message}")

    def skip(self, label: str) -> None:
        self.tally.skipped += 1
        log(f"  = {label} (already there)")

    def fail(self, label: str, detail: str) -> None:
        self.tally.failed += 1
        self.tally.failures.append(f"{label}: {detail}")
        log(f"  ! {label} FAILED: {detail}")

    def login(self, email: str, password: str, device_uuid: str | None = None, tenant_slug: str | None = None) -> str | None:
        body: dict[str, Any] = {"email": email, "password": password}
        if device_uuid:
            body["device_uuid"] = device_uuid
        if tenant_slug:
            body["tenant_slug"] = tenant_slug
        response = self.send("POST", "/auth/login", json=body)
        if response.status_code != 200:
            self.fail(f"login {email}", f"{response.status_code}: {response.text[:200]}")
            return None
        return response.json()["access_token"]


def log(message: str) -> None:
    sys.stdout.write(message + "\n")
    sys.stdout.flush()


def section(title: str) -> None:
    log(f"\n== {title}")
