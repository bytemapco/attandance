"""Helper for the `/bulk` import endpoints, which report per-row results instead of one status."""
from typing import Any

from seedlib.client import Api


def bulk_import(api: Api, label: str, path: str, token: str, key: str, rows: list[dict[str, Any]], **extra: Any) -> None:
    if not rows:
        return
    result = api.send("POST", path, token, json={key: rows, **extra})
    if result.status_code != 200:
        api.fail(f"bulk import {label}", f"{result.status_code}: {result.text[:240]}")
        return
    body = result.json()
    api.tally.created += body["imported_count"]
    api.tally.failed += body["failed_count"]
    api.tally.failures.extend(f"bulk import {label}: {error}" for error in body["errors"])
    api.note(f"bulk import {label}: {body['imported_count']} created, {body['failed_count']} failed")
