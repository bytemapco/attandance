"""What each person does with an announcement stays their own, and a scheduled one appears and is pushed once."""
from datetime import datetime, timedelta, timezone

from app.services.announcements import publisher
from tests.integration.announcement_world import (
    INBOX, Campus, announce, inbox, platform_owner, seen, unique_title,
)


def sent_to_students(client, seed, conn):
    campus, owner, title = Campus(seed, conn), platform_owner(seed, client), unique_title()
    announce(client, owner, title, target_role="STUDENT", target_tenant_id=campus.tenant_id)
    item = next(i for i in inbox(client, campus.students[0], page_size=100)["items"] if i["title"] == title)
    return campus, title, item["id"]


class TestReadAndRemove:
    def test_reading_it_marks_it_read_for_that_person_only(self, client, seed, conn):
        campus, title, notice = sent_to_students(client, seed, conn)
        first, second = campus.students[0], campus.students[1]

        assert client.patch(f"{INBOX}/{notice}/read", headers=first).status_code == 200

        read = {i["id"]: i["is_read"] for i in inbox(client, first, page_size=100)["items"]}
        unread = {i["id"]: i["is_read"] for i in inbox(client, second, page_size=100)["items"]}
        assert read[notice] is True and unread[notice] is False
        assert inbox(client, first)["unread_count"] == 0 and inbox(client, second)["unread_count"] == 1

    def test_reading_it_again_is_fine(self, client, seed, conn):
        campus, _, notice = sent_to_students(client, seed, conn)
        assert [client.patch(f"{INBOX}/{notice}/read", headers=campus.students[0]).status_code for _ in range(2)] == [200, 200]

    def test_someone_it_was_not_sent_to_cannot_mark_it(self, client, seed, conn):
        campus, _, notice = sent_to_students(client, seed, conn)
        assert client.patch(f"{INBOX}/{notice}/read", headers=campus.teachers[0]).status_code == 404

    def test_removing_it_removes_it_for_that_person_only(self, client, seed, conn):
        campus, title, notice = sent_to_students(client, seed, conn)

        assert client.delete(f"{INBOX}/{notice}", headers=campus.students[0]).status_code == 200

        assert seen(client, campus.students[0], title) == 0
        assert seen(client, campus.students[1], title) == 1
        assert campus.world.scalar("SELECT count(*) FROM announcements WHERE id = %s", notice) == 1

    def test_mark_all_read_and_clear_all_touch_only_the_callers_own_list(self, client, seed, conn):
        campus, title, _ = sent_to_students(client, seed, conn)
        first, second = campus.students[0], campus.students[1]

        client.patch(f"{INBOX}/mark-all-read", headers=first)
        assert inbox(client, first)["unread_count"] == 0 and inbox(client, second)["unread_count"] == 1

        client.delete(f"{INBOX}/all", headers=first)
        assert seen(client, first, title) == 0 and seen(client, second, title) == 1

    def test_bulk_remove_takes_both_kinds_off_the_list(self, client, seed, conn):
        campus, title, notice = sent_to_students(client, seed, conn)
        student = campus.students[0]
        personal = seed.insert("notifications", tenant_id=campus.tenant_id, user_id=campus.user_id(student), title="Mine", message="m")

        done = client.post(f"{INBOX}/bulk-delete", headers=student, json={"ids": [notice, personal]})

        assert done.status_code == 200 and "2 notifications deleted" == done.json()["message"]
        assert seen(client, student, title) == seen(client, student, "Mine") == 0


class TestPersonalNotifications:
    def test_a_personal_notification_is_only_its_owners(self, client, seed, conn):
        campus = Campus(seed, conn)
        owner, other = campus.students[0], campus.students[1]
        mine = seed.insert("notifications", tenant_id=campus.tenant_id, user_id=campus.user_id(owner), title="Leave approved", message="m")

        assert seen(client, other, "Leave approved") == 0
        assert client.patch(f"{INBOX}/{mine}/read", headers=other).status_code == 404
        assert client.delete(f"{INBOX}/{mine}", headers=other).status_code == 404
        assert seen(client, owner, "Leave approved") == 1

    def test_a_copy_written_for_each_person_by_the_old_broadcast_is_seen_once(self, client, seed, conn):
        campus = Campus(seed, conn)
        title = unique_title("Old broadcast")
        for student in campus.students:  # what the old platform broadcast stored: one row per person, with their role
            seed.insert("notifications", user_id=campus.user_id(student), role="STUDENT", title=title, message="m")
        assert [seen(client, student, title) for student in campus.students] == [1, 1, 1]

    def test_categories_the_assistant_and_the_briefing_use_are_listed(self, client, seed, conn):
        campus = Campus(seed, conn)
        student = campus.students[0]
        for category in ("message", "briefing", "schedule"):
            seed.insert("notifications", user_id=campus.user_id(student), title=f"Kind {category}", message="m", category=category)
        assert {i["category"] for i in inbox(client, student, page_size=100)["items"]} >= {"message", "briefing", "schedule"}

    def test_the_unread_and_category_filters_apply_to_both_kinds(self, client, seed, conn):
        campus, title, notice = sent_to_students(client, seed, conn)
        student = campus.students[0]
        client.patch(f"{INBOX}/{notice}/read", headers=student)
        seed.insert("notifications", user_id=campus.user_id(student), title="Unread one", message="m", category="leave")

        unread = inbox(client, student, unread_only=True, page_size=100)
        assert [i["title"] for i in unread["items"]] == ["Unread one"] and unread["total_count"] == 1
        assert [i["title"] for i in inbox(client, student, category="system", page_size=100)["items"]] == [title]


class TestScheduling:
    def schedule(self, client, seed, conn, when):
        campus, owner, title = Campus(seed, conn), platform_owner(seed, client), unique_title()
        sent = announce(client, owner, title, target_role="STUDENT", target_tenant_id=campus.tenant_id, publish_at=when.isoformat())
        assert sent.status_code == 200
        return campus, title, sent.json()

    def test_a_scheduled_announcement_is_not_seen_before_its_time(self, client, seed, conn):
        campus, title, result = self.schedule(client, seed, conn, datetime.now(timezone.utc) + timedelta(hours=2))
        assert result["status"] == "scheduled" and seen(client, campus.students[0], title) == 0

    def test_it_appears_once_its_time_has_come_and_is_pushed_once(self, client, seed, conn, monkeypatch):
        campus, title, _ = self.schedule(client, seed, conn, datetime.now(timezone.utc) + timedelta(hours=2))
        pushed: list[str] = []

        async def record(payload, roles=None, tenant_id=None):
            pushed.append(payload["data"]["title"])

        monkeypatch.setattr(publisher.manager, "broadcast", record)
        assert campus.world.scalar("SELECT pushed_at FROM announcements WHERE title = %s", title) is None

        with conn.cursor() as cursor:
            cursor.execute("UPDATE announcements SET publish_at = now() - interval '1 minute' WHERE title = %s", (title,))
        assert seen(client, campus.students[0], title) == 1
        client.portal.call(publisher.push_due)
        client.portal.call(publisher.push_due)

        assert pushed.count(title) == 1
        assert campus.world.scalar("SELECT pushed_at FROM announcements WHERE title = %s", title) is not None

    def test_a_time_already_past_means_now(self, client, seed, conn):
        campus, title, result = self.schedule(client, seed, conn, datetime.now(timezone.utc) - timedelta(days=1))
        assert result["status"] == "sent" and seen(client, campus.students[0], title) == 1


class TestPlatformHistory:
    def test_the_history_lists_what_the_platform_owner_sent_with_its_status(self, client, seed, conn):
        campus, owner = Campus(seed, conn), platform_owner(seed, client)
        announce(client, owner, "Sent now", target_role="TEACHER", target_tenant_id=campus.tenant_id)
        announce(client, owner, "Sent later", target_role="TEACHER", target_tenant_id=campus.tenant_id,
                 publish_at=(datetime.now(timezone.utc) + timedelta(days=1)).isoformat())

        items = client.get("/api/v1/super-admin/broadcasts", headers=owner, params={"page_size": 100}).json()["items"]
        by_title = {i["title"]: i for i in items}

        assert by_title["Sent now"]["status"] == "sent" and by_title["Sent later"]["status"] == "scheduled"
        teachers = campus.world.scalar("SELECT count(*) FROM users WHERE tenant_id = %s AND role = 'TEACHER'", campus.tenant_id)
        assert by_title["Sent now"]["audience"] == "TEACHER" and by_title["Sent now"]["audience_count"] == teachers

    def test_an_institutions_own_announcement_is_not_in_the_platform_history(self, client, seed, conn):
        campus, owner, title = Campus(seed, conn), platform_owner(seed, client), unique_title()
        client.post("/api/v1/notifications/broadcast", headers=campus.admin, json={"title": title, "message": "hello all", "target_role": "STUDENT"})
        items = client.get("/api/v1/super-admin/broadcasts", headers=owner, params={"page_size": 100}).json()["items"]
        assert title not in [i["title"] for i in items]
