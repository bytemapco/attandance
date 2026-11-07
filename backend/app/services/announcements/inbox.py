"""A person's inbox: the notifications written for them and the announcements they may see, newest first.
An announcement is shared, so reading or removing one is recorded for that person only."""
from typing import Any, Optional

from prisma.models import User

from app.db.client import db
from app.services.announcements.audience import audience_of, visible_to

# Query parameters: $1 the person, $2 their institution, $3 their audience.
_INBOX = f"""
    SELECT n.id, 'personal' AS kind, n.title, n.message, n.type, n.category, n.link, n.is_read, n.created_at
    FROM notifications n WHERE n.user_id = $1::text
    UNION ALL
    SELECT a.id, 'announcement', a.title, a.message, a.type, a.category, a.link,
           (r.announcement_id IS NOT NULL), a.publish_at
    FROM announcements a
    LEFT JOIN announcement_reads r ON r.announcement_id = a.id AND r.user_id = $1::text
    WHERE {visible_to('a', 2, 3)} AND r.dismissed_at IS NULL
"""
_CATEGORY = "($4::text IS NULL OR category = $4::text)"


def _who(user: User) -> list[Any]:
    return [user.id, user.tenantId, audience_of(user.role)]


def _item(row: dict[str, Any], user: User) -> dict[str, Any]:
    return {**row, "user_id": user.id if row["kind"] == "personal" else None}


async def list_inbox(
    user: User, unread_only: bool = False, category: Optional[str] = None, page: int = 1, page_size: int = 10
) -> dict[str, Any]:
    category = None if category in (None, "all") else category
    counts = (
        await db.query_raw(
            f"SELECT count(*)::int AS total, (count(*) FILTER (WHERE NOT is_read))::int AS unread "
            f"FROM ({_INBOX}) inbox WHERE {_CATEGORY}",
            *_who(user), category,
        )
    )[0]
    rows = await db.query_raw(
        f"SELECT * FROM ({_INBOX}) inbox WHERE {_CATEGORY} AND ($5::boolean = false OR NOT is_read) "
        f"ORDER BY created_at DESC, id LIMIT $6::int OFFSET $7::int",
        *_who(user), category, unread_only, page_size, (max(1, page) - 1) * page_size,
    )
    return {
        "items": [_item(row, user) for row in rows],
        "total_count": counts["unread"] if unread_only else counts["total"],
        "unread_count": counts["unread"],
    }


async def mark_read(user: User, notification_id: str) -> bool:
    """True when the person has this notification or announcement. Marking it again is fine."""
    if await db.execute_raw(
        "UPDATE notifications SET is_read = true WHERE id = $1::text AND user_id = $2::text", notification_id, user.id
    ):
        return True
    return bool(
        await db.execute_raw(
            f"INSERT INTO announcement_reads (announcement_id, user_id) "
            f"SELECT a.id, $1::text FROM announcements a WHERE a.id = $4::text AND {visible_to('a', 2, 3)} "
            f"ON CONFLICT (announcement_id, user_id) DO UPDATE SET read_at = announcement_reads.read_at",
            *_who(user), notification_id,
        )
    )


async def mark_all_read(user: User) -> int:
    personal = await db.execute_raw("UPDATE notifications SET is_read = true WHERE user_id = $1::text AND NOT is_read", user.id)
    shared = await db.execute_raw(
        f"INSERT INTO announcement_reads (announcement_id, user_id) "
        f"SELECT a.id, $1::text FROM announcements a WHERE {visible_to('a', 2, 3)} ON CONFLICT DO NOTHING",
        *_who(user),
    )
    return personal + shared


async def remove(user: User, ids: list[str]) -> int:
    """Deletes the person's own notifications and takes announcements off their list, for them alone."""
    personal = await db.execute_raw(
        "DELETE FROM notifications WHERE id = ANY($1::text[]) AND user_id = $2::text", ids, user.id
    )
    shared = await db.execute_raw(
        f"INSERT INTO announcement_reads (announcement_id, user_id, dismissed_at) "
        f"SELECT a.id, $1::text, now() FROM announcements a WHERE a.id = ANY($4::text[]) AND {visible_to('a', 2, 3)} "
        f"ON CONFLICT (announcement_id, user_id) DO UPDATE SET dismissed_at = now()",
        *_who(user), ids,
    )
    return personal + shared


async def remove_all(user: User) -> int:
    personal = await db.execute_raw("DELETE FROM notifications WHERE user_id = $1::text", user.id)
    shared = await db.execute_raw(
        f"INSERT INTO announcement_reads (announcement_id, user_id, dismissed_at) "
        f"SELECT a.id, $1::text, now() FROM announcements a WHERE {visible_to('a', 2, 3)} "
        f"ON CONFLICT (announcement_id, user_id) DO UPDATE SET dismissed_at = now()",
        *_who(user),
    )
    return personal + shared
