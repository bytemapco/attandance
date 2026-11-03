"""Filtering, searching, sorting and paging shared by the student and teacher lists."""
from typing import Optional

ALL = "all"


def selected(value: Optional[str]) -> bool:
    """True when a filter names something; the web app sends "all" for an untouched dropdown."""
    return bool(value) and value != ALL


def with_account_status(where: dict, status: Optional[str]) -> None:
    """Narrows a list of profiles to active or inactive accounts."""
    if not (status and status.strip() and status != ALL):
        return
    account = where.get("user", {}).get("is", {})
    where["user"] = {"is": {**account, "isActive": status.lower() == "active"}}


def text_search(query: Optional[str], columns: tuple[str, ...]) -> Optional[list[dict]]:
    """An OR clause matching the text in any column or in the account's e-mail; None for a blank query."""
    if not (query and query.strip()):
        return None
    text = query.strip()
    clauses = [{column: {"contains": text, "mode": "insensitive"}} for column in columns]
    clauses.append({"user": {"is": {"email": {"contains": text, "mode": "insensitive"}}}})
    return clauses


def ordering(sort_by: Optional[str], sort_order: str, allowed: dict[str, str]) -> dict[str, str]:
    return {allowed.get(sort_by, "createdAt"): "desc" if sort_order.lower() == "desc" else "asc"}
