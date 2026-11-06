"""The shapes the assistant is built from: who is asking, what a tool is, and what a tool hands back."""
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Optional

from prisma.models import Teacher, User
from pydantic import BaseModel

ADMIN = "ADMIN"
TEACHER = "TEACHER"
ADMIN_ROLES = frozenset({"ADMIN", "TENANT_ADMIN"})


@dataclass(frozen=True)
class Principal:
    """The signed-in person. The tenant and role come from their verified account, never from the model."""

    user: User
    role: str  # ADMIN or TEACHER
    tenant_id: str
    teacher: Optional[Teacher] = None

    @property
    def user_id(self) -> str:
        return self.user.id


@dataclass
class ToolResult:
    """`data` goes back to the model. `ui` is shown to the person as tables, links and drafts."""

    data: dict[str, Any]
    ui: list[dict[str, Any]] = field(default_factory=list)


@dataclass(frozen=True)
class Preview:
    """What a write would do, worked out without doing it."""

    summary: str
    details: dict[str, Any] = field(default_factory=dict)


Handler = Callable[[Principal, Any], Awaitable[ToolResult]]
PreviewFn = Callable[[Principal, Any], Awaitable[Preview]]


@dataclass(frozen=True)
class Tool:
    """A tool is read-only unless it has a `preview`; a write only runs after the person confirms it."""

    name: str
    description: str
    params: type[BaseModel]
    roles: frozenset[str]
    run: Handler
    preview: Optional[PreviewFn] = None
    editable: frozenset[str] = frozenset()  # arguments the person may change on the confirmation card

    @property
    def writes(self) -> bool:
        return self.preview is not None
