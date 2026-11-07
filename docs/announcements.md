# Announcements and notifications

Two different things reach a person's notification list. They are stored differently on purpose.

| | Personal notification | Announcement |
|---|---|---|
| What | A message for one person: leave decided, flagged scan reviewed, a class you cover, the assistant's message | A message for a group: from the platform owner or from an institution |
| Table | `notifications` (always has a `user_id`) | `announcements` (stored once) |
| Read, remove | A flag on the row | One row per person in `announcement_reads`; no row means unread |
| Who can send | The product, on events | Super admin, institution admin, teacher (students only) |

## Why an announcement is stored once

The platform broadcast used to write one `notifications` row per person, stamped with the person's role. The list showed every row whose role matched the viewer's, so a broadcast to *N* students showed each student *N* copies. It also stopped at 5,000 people, and one person reading a shared row read it for everyone.

Now an announcement is one row. Who may see it is worked out when the list is read, by one SQL rule (`announcements/audience.py: visible_to`): it is published, it is for the person's institution or for all of them, and it is for their audience or for everyone. Reading or removing it writes only the reader's own row.

## Audiences

`ALL`, `STUDENT`, `TEACHER`, `ADMIN`. `ADMIN` covers both `ADMIN` and `TENANT_ADMIN` accounts. A platform announcement with no institution reaches every institution. The platform owner's account belongs to no audience except `ALL`.

## Sending

1. `POST /notifications/broadcast` (admin or teacher) and `POST /super-admin/broadcast` call the same `announcements/publisher.publish`.
2. It saves the announcement first. `publish_at` is now, or later for a scheduled one; a time already past means now.
3. `push_due()` then claims each announcement that is due and not yet pushed (`UPDATE ... WHERE pushed_at IS NULL`) and tells the people who are connected. The claim makes the push happen once even when the API and the worker both run it.
4. The worker runs `push_due` every minute (`push_due_announcements` in `worker.py`), so a scheduled announcement is pushed when its time comes. Without the worker it still appears at the next refresh of the list.

A person who is offline, or whose push is lost, finds the announcement in their list. The push is only a signal.

## What the live push does

`ConnectionManager.deliver_broadcast(message, roles, tenant_id)` sends to the connected people of the given roles in one institution. An institution nobody has connected to receives nothing; it never falls back to everyone. The event carries the announcement's `id`, and the web app announces each `id` once and does not toast the sender.

## The list

`GET /notifications` returns the person's own notifications and the announcements they may see, newest first, in one query. Each item has `kind` (`personal` or `announcement`). Marking read and removing act on the signed-in person only: a personal notification that is not theirs, or an announcement they cannot see, answers 404.

## Moving old data

`prisma/migrations/20261107000000_announcements/migration.sql` ends with a data move, run by hand once: the old shared rows (a notification with no user) become announcements and are marked read for the people they reach. The one-row-per-person copies keep their user and stay as personal notifications; the list now shows each person only their own.

The `role` column on `notifications` is no longer used. It stays because `prisma db push` cannot drop a column that holds data without approval.

## Tests

`tests/integration/test_announcements.py`, `test_announcement_inbox.py` (read, remove, schedule, history), `test_announcement_live.py` (real WebSockets), `tests/unit/test_announcement_delivery.py`. Web: `src/__tests__/hooks/usePlatformWebSocket.test.tsx`, `components/announcements.test.tsx`, `lib/announcements.test.ts`.
