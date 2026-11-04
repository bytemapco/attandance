"""State shared between seed steps: credentials, tokens and the ids the API handed back."""
from dataclasses import dataclass, field

from seedlib.client import Api


@dataclass
class Person:
    id: str
    user_id: str
    email: str


@dataclass
class Ctx:
    api: Api
    password: str
    super_email: str
    super_password: str
    fresh: bool = False  # True when this run created the institution
    super_token: str = ""
    admin_token: str = ""
    tenant_id: str = ""
    departments: dict[str, str] = field(default_factory=dict)
    designations: dict[str, str] = field(default_factory=dict)
    rooms: dict[str, str] = field(default_factory=dict)
    subjects: dict[str, str] = field(default_factory=dict)
    batches: dict[str, str] = field(default_factory=dict)
    teachers: dict[str, Person] = field(default_factory=dict)
    students: dict[str, Person] = field(default_factory=dict)
    classes: dict[str, str] = field(default_factory=dict)
    sections: dict[tuple[str, str], str] = field(default_factory=dict)
    teacher_tokens: dict[str, str] = field(default_factory=dict)
    student_tokens: dict[str, str] = field(default_factory=dict)
