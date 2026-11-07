"""An announcement is stored once and reaches each person it is for exactly once, and nobody else."""
from tests.integration.announcement_world import SEND, Campus, announce, inbox, platform_owner, seen, unique_title


class TestWhoReceivesIt:
    def test_a_platform_announcement_to_students_is_seen_once_by_each_student(self, client, seed, conn):
        campus, owner, title = Campus(seed, conn), platform_owner(seed, client), unique_title()

        assert announce(client, owner, title, target_role="STUDENT", target_tenant_id=campus.tenant_id).status_code == 200

        assert [seen(client, headers, title) for headers in campus.students] == [1, 1, 1]
        assert [seen(client, headers, title) for headers in [*campus.teachers, campus.admin, campus.tenant_admin]] == [0, 0, 0, 0]

    def test_it_is_stored_as_one_row_not_one_per_person(self, client, seed, conn):
        campus, owner = Campus(seed, conn), platform_owner(seed, client)
        announce(client, owner, target_role="ALL", target_tenant_id=campus.tenant_id)
        assert campus.world.scalar("SELECT count(*) FROM announcements WHERE tenant_id = %s", campus.tenant_id) == 1
        assert campus.world.scalar("SELECT count(*) FROM notifications WHERE tenant_id = %s", campus.tenant_id) == 0

    def test_admins_means_every_kind_of_institution_admin(self, client, seed, conn):
        campus, owner, title = Campus(seed, conn), platform_owner(seed, client), unique_title()
        announce(client, owner, title, target_role="ADMIN", target_tenant_id=campus.tenant_id)
        assert [seen(client, headers, title) for headers in (campus.admin, campus.tenant_admin)] == [1, 1]
        assert [seen(client, headers, title) for headers in (campus.students[0], campus.teachers[0])] == [0, 0]

    def test_everyone_in_the_institution_receives_an_announcement_to_all(self, client, seed, conn):
        campus, owner, title = Campus(seed, conn), platform_owner(seed, client), unique_title()
        announce(client, owner, title, target_role="ALL", target_tenant_id=campus.tenant_id)
        assert [seen(client, headers, title) for headers in campus.everyone] == [1] * 7

    def test_another_institution_never_sees_it(self, client, seed, conn):
        campus, other, owner, title = Campus(seed, conn), Campus(seed, conn), platform_owner(seed, client), unique_title()
        announce(client, owner, title, target_role="ALL", target_tenant_id=campus.tenant_id)
        assert [seen(client, headers, title) for headers in other.everyone] == [0] * 7

    def test_an_announcement_to_all_institutions_reaches_each_of_them_once(self, client, seed, conn):
        first, second, owner, title = Campus(seed, conn), Campus(seed, conn), platform_owner(seed, client), unique_title()
        announce(client, owner, title, target_role="TEACHER")
        assert [seen(client, first.teachers[0], title), seen(client, second.teachers[1], title)] == [1, 1]
        assert seen(client, first.students[0], title) == 0

    def test_the_audience_size_is_recorded_when_it_is_sent(self, client, seed, conn):
        campus, owner = Campus(seed, conn), platform_owner(seed, client)
        announce(client, owner, target_role="STUDENT", target_tenant_id=campus.tenant_id)
        count = campus.world.scalar("SELECT audience_count FROM announcements WHERE tenant_id = %s", campus.tenant_id)
        assert count == campus.world.scalar("SELECT count(*) FROM users WHERE tenant_id = %s AND role = 'STUDENT'", campus.tenant_id)

    def test_an_unknown_institution_is_refused(self, client, seed, conn):
        owner = platform_owner(seed, client)
        assert announce(client, owner, target_tenant_id="no-such-institution").status_code == 404


class TestInstitutionSenders:
    def test_an_admin_announces_to_their_own_institution_only(self, client, seed, conn):
        campus, other, title = Campus(seed, conn), Campus(seed, conn), unique_title()
        sent = client.post(SEND, headers=campus.admin, json={"title": title, "message": "No classes on Friday.", "target_role": "STUDENT"})
        assert sent.status_code == 200 and sent.json()["message"] == "Announcement sent"
        assert [seen(client, headers, title) for headers in campus.students] == [1, 1, 1]
        assert [seen(client, headers, title) for headers in other.everyone] == [0] * 7

    def test_a_teacher_may_announce_to_students_but_to_nobody_else(self, client, seed, conn):
        campus = Campus(seed, conn)
        body = {"title": "Quiz", "message": "A quiz on Monday."}
        assert client.post(SEND, headers=campus.teachers[0], json={**body, "target_role": "STUDENT"}).status_code == 200
        assert client.post(SEND, headers=campus.teachers[0], json={**body, "target_role": "ADMIN"}).status_code == 403
        assert client.post(SEND, headers=campus.teachers[0], json=body).status_code == 403  # the default is everyone

    def test_a_student_cannot_announce(self, client, seed, conn):
        campus = Campus(seed, conn)
        assert client.post(SEND, headers=campus.students[0], json={"title": "Hi", "message": "Hello all"}).status_code == 403


def test_the_inbox_counts_and_pages_personal_notices_and_announcements_together(client, seed, conn):
    campus, owner = Campus(seed, conn), platform_owner(seed, client)
    student = campus.students[0]
    for number in range(3):
        seed.insert("notifications", tenant_id=campus.tenant_id, user_id=campus.user_id(student), title=f"Personal {number}", message="m", category="message")
    for number in range(2):
        announce(client, owner, f"Announcement {number}", target_role="STUDENT", target_tenant_id=campus.tenant_id)

    first = inbox(client, student, page=1, page_size=2)
    last = inbox(client, student, page=3, page_size=2)

    assert first["total_count"] == 5 and first["unread_count"] == 5 and len(first["items"]) == 2
    assert len(last["items"]) == 1
    assert {item["kind"] for item in inbox(client, student, page_size=10)["items"]} == {"personal", "announcement"}
