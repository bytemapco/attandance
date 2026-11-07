"""One institution for the assistant tests: an admin, a teacher with a subject and two students, and a scripted model."""
import json
from datetime import datetime

from app.core.security import create_access_token
from app.services.agent.llm import LlmTurn, ToolCall, set_llm


class ScriptedModel:
    """Stands in for Gemini. It plays back the turns it was given and records what the loop showed it."""

    def __init__(self, *turns: LlmTurn):
        self.turns = list(turns)
        self.tools_offered: list[list[str]] = []
        self.tool_results: list[dict] = []

    async def stream(self, system, history, tools):
        self.tools_offered.append([t.name for t in tools])
        if history and history[-1]["role"] == "tool":
            self.tool_results.extend(r["response"] for r in history[-1]["results"])
        yield self.turns.pop(0)


def says(text: str) -> LlmTurn:
    return LlmTurn(text=text, tokens=10)


def calls(name: str, /, **args) -> LlmTurn:
    return LlmTurn(calls=[ToolCall(name, args)], tokens=10)


class World:
    def __init__(self, seed, conn):
        self.seed, self.conn = seed, conn
        self.tenant_id = seed.tenant()
        self.department_id = seed.department(self.tenant_id)
        self.admin_user = seed.user(self.tenant_id, "TENANT_ADMIN")
        self.teacher_id = seed.teacher(self.tenant_id)
        self.teacher_user = self.scalar("SELECT user_id FROM teachers WHERE id = %s", self.teacher_id)
        self.section_id = seed.section(self.tenant_id)
        seed.insert("course_faculties", course_section_id=self.section_id, teacher_id=self.teacher_id)
        self.students = [seed.student(self.tenant_id, self.department_id) for _ in range(2)]
        for student_id in self.students:
            seed.insert("course_enrollments", course_section_id=self.section_id, student_id=student_id, enrolled_at=datetime(2026, 8, 1))
        self.stranger = seed.student(self.tenant_id, self.department_id)  # taught by nobody here
        self.group_id = seed.insert("student_groups", tenant_id=self.tenant_id, department_id=self.department_id, batch="CE-A-1")
        with conn.cursor() as cursor:
            cursor.execute("UPDATE course_sections SET group_id = %s WHERE id = %s", (self.group_id, self.section_id))

    def hold_classes(self, attended_by: dict[str, int], held: int = 4) -> None:
        """Closed classes: each student is present in the first `attended_by[student]` of `held` classes."""
        for number in range(held):
            occurrence = self.seed.insert(
                "class_occurrences", tenant_id=self.tenant_id, course_section_id=self.section_id,
                date=datetime(2026, 10, 1 + number), start_time="09:00", end_time="10:00", faculty_id=self.teacher_id,
                status="CONDUCTED", is_attendance_locked=True,
            )
            for student_id, attended in attended_by.items():
                self.seed.record(self.tenant_id, occurrence, student_id, "PRESENT" if number < attended else "ABSENT")

    def scalar(self, sql: str, *params):
        with self.conn.cursor() as cursor:
            cursor.execute(sql, params)
            row = cursor.fetchone()
            return row[0] if row else None

    def student_user(self, student_id: str) -> str:
        return self.scalar("SELECT user_id FROM students WHERE id = %s", student_id)

    def headers(self, user_id: str, role: str) -> dict:
        token = create_access_token(user_id, role, extra_data={"tid": self.tenant_id, "tenant_id": self.tenant_id})
        return {"Authorization": f"Bearer {token}", "X-Tenant-ID": self.tenant_id}

    @property
    def admin(self) -> dict:
        return self.headers(self.admin_user, "TENANT_ADMIN")

    @property
    def teacher(self) -> dict:
        return self.headers(self.teacher_user, "TEACHER")

    def notifications_for(self, user_id: str) -> int:
        return self.scalar("SELECT count(*) FROM notifications WHERE user_id = %s", user_id)


def events(response) -> list[dict]:
    return [json.loads(line) for line in response.text.splitlines() if line.strip()]


CHAT = "/api/v1/agent/chat"
ACCEPT = "/api/v1/agent/notice/accept"


def propose(client, world, headers, tool: str, **args):
    """The model calls one write tool; returns (the confirmation card or None, what the model was told)."""
    client.post(ACCEPT, headers=world.admin)
    model = ScriptedModel(calls(tool, **args), says("Check the card"))
    set_llm(model)
    reply = events(client.post(CHAT, json={"message": "do it"}, headers=headers))
    return next((e for e in reply if e["type"] == "proposal"), None), model.tool_results[0]


def ask(client, world, headers, tool, **args):
    """The model calls one read tool; returns what the model was told."""
    client.post(ACCEPT, headers=world.admin)
    model = ScriptedModel(calls(tool, **args), says("done"))
    set_llm(model)
    events(client.post(CHAT, json={"message": "go"}, headers=headers))
    return model.tool_results[0]


def count(world, table, where="tenant_id = %s", *params):
    return world.scalar(f"SELECT count(*) FROM {table} WHERE {where}", *(params or (world.tenant_id,)))


def batch(seed, world, code="A-1"):
    """Batch codes carry the department code, like CE-A-1."""
    prefix = world.scalar("SELECT code FROM departments WHERE id = %s", world.department_id)
    return seed.insert("batches", tenant_id=world.tenant_id, department_id=world.department_id, section=code[0],
                       number=int(code[-1]), code=f"{prefix}-{code}", status="ACTIVE")


def make_primary(conn, world):
    with conn.cursor() as cursor:
        cursor.execute("UPDATE course_faculties SET is_primary = true WHERE course_section_id = %s", (world.section_id,))


def confirm(client, headers, card, edits=None):
    return client.post(f"/api/v1/agent/proposals/{card['id']}/confirm", json={"edits": edits or {}}, headers=headers)
