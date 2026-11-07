"""Over real WebSocket connections: an announcement arrives once, for the people it is for, and for nobody else."""
from contextlib import ExitStack, contextmanager

from app.services.notification_service import create_in_app_notification
from tests.integration.announcement_world import Campus, announce, platform_owner, unique_title

CONNECT = "/api/v1/ws/connect"


@contextmanager
def listening(client, headers):
    """A signed-in WebSocket, past the handshake."""
    with client.websocket_connect(CONNECT) as socket:
        socket.send_json({"type": "auth", "token": headers["Authorization"].split()[1]})
        assert socket.receive_json()["type"] == "connected"
        yield socket


def next_message(socket):
    """What the socket receives next. A ping is answered after anything already queued, so a pong means nothing was."""
    socket.send_text("ping")
    return socket.receive_json()


def test_the_right_people_are_told_once_and_the_others_nothing(client, seed, conn):
    campus, other, owner, title = Campus(seed, conn), Campus(seed, conn), platform_owner(seed, client), unique_title()
    with ExitStack() as stack:
        student = stack.enter_context(listening(client, campus.students[0]))
        second_student = stack.enter_context(listening(client, campus.students[1]))
        teacher = stack.enter_context(listening(client, campus.teachers[0]))
        stranger = stack.enter_context(listening(client, other.students[0]))

        announce(client, owner, title, target_role="STUDENT", target_tenant_id=campus.tenant_id, type="critical")

        for socket in (student, second_student):
            pushed = socket.receive_json()
            assert pushed["event"] == "NOTIFICATION_RECEIVED"
            assert (pushed["data"]["title"], pushed["data"]["kind"], pushed["data"]["type"]) == (title, "announcement", "critical")
            assert pushed["data"]["id"] and pushed["data"]["is_read"] is False
            assert next_message(socket) == {"type": "pong"}  # and nothing else was sent
        assert next_message(teacher) == {"type": "pong"}
        assert next_message(stranger) == {"type": "pong"}


def test_an_institution_nobody_is_connected_to_does_not_make_it_go_to_everyone(client, seed, conn):
    connected, empty, owner = Campus(seed, conn), Campus(seed, conn), platform_owner(seed, client)
    with listening(client, connected.students[0]) as student:
        announce(client, owner, target_role="ALL", target_tenant_id=empty.tenant_id)
        assert next_message(student) == {"type": "pong"}


def test_admins_includes_the_institution_admin_role(client, seed, conn):
    campus, owner, title = Campus(seed, conn), platform_owner(seed, client), unique_title()
    with listening(client, campus.tenant_admin) as tenant_admin, listening(client, campus.admin) as admin, listening(client, campus.teachers[0]) as teacher:
        announce(client, owner, title, target_role="ADMIN", target_tenant_id=campus.tenant_id)

        assert tenant_admin.receive_json()["data"]["title"] == title
        assert admin.receive_json()["data"]["title"] == title
        assert next_message(teacher) == {"type": "pong"}


def test_the_sender_is_named_so_the_screen_can_skip_their_own_toast(client, seed, conn):
    campus = Campus(seed, conn)
    with listening(client, campus.admin) as admin:
        client.post("/api/v1/notifications/broadcast", headers=campus.admin, json={"title": "Own", "message": "hello all", "target_role": "ADMIN"})
        pushed = admin.receive_json()
        assert pushed["data"]["sender_id"] == campus.user_id(campus.admin)


def test_a_personal_notification_is_pushed_only_to_its_person(client, seed, conn):
    campus = Campus(seed, conn)
    with listening(client, campus.students[0]) as owner, listening(client, campus.students[1]) as other:
        client.portal.call(
            lambda: create_in_app_notification("Leave approved", "Your leave was approved.", campus.user_id(campus.students[0]), campus.tenant_id)
        )

        pushed = owner.receive_json()
        assert (pushed["data"]["kind"], pushed["data"]["title"]) == ("personal", "Leave approved")
        assert next_message(other) == {"type": "pong"}
