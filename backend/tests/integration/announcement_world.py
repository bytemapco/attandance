"""Two institutions with people of every role, a platform owner, and helpers to send and read announcements."""
import uuid

from tests.integration.agent_world import World
from tests.integration.institution import Institution

BROADCAST = "/api/v1/super-admin/broadcast"
HISTORY = "/api/v1/super-admin/broadcasts"
INBOX = "/api/v1/notifications"
SEND = "/api/v1/notifications/broadcast"


class Campus:
    """One institution with three students, two teachers and an admin of each admin kind."""

    def __init__(self, seed, conn):
        self.world = World(seed, conn)
        self.tenant_id = self.world.tenant_id
        self.user_ids: dict[int, str] = {}
        self.students = [self._person(seed, "STUDENT") for _ in range(3)]
        self.teachers = [self._person(seed, "TEACHER") for _ in range(2)]
        self.admin = self._person(seed, "ADMIN")
        self.tenant_admin = self._person(seed, "TENANT_ADMIN")

    def _person(self, seed, role):
        user_id = seed.user(self.tenant_id, role)
        headers = self.world.headers(user_id, role)
        self.user_ids[id(headers)] = user_id
        return headers

    def user_id(self, headers) -> str:
        return self.user_ids[id(headers)]

    @property
    def everyone(self):
        return [*self.students, *self.teachers, self.admin, self.tenant_admin]


def unique_title(prefix="Notice") -> str:
    """Announcements to every institution stay in the test database, so each test looks for its own."""
    return f"{prefix} {uuid.uuid4().hex[:8]}"


def platform_owner(seed, client):
    return Institution(seed, role="SUPER_ADMIN").sign_in(client)


def announce(client, headers, title=None, **overrides):
    body = {"title": title or unique_title(), "message": "The system is down from 10 pm.", **overrides}
    return client.post(BROADCAST, headers=headers, json=body)


def inbox(client, headers, **params):
    response = client.get(INBOX, headers=headers, params=params)
    assert response.status_code == 200, response.text
    return response.json()


def titles(client, headers, **params):
    return [item["title"] for item in inbox(client, headers, **params)["items"]]


def seen(client, headers, title):
    """How many times this announcement is in the person's first page of 100."""
    return titles(client, headers, page_size=100).count(title)
