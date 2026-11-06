"""Writes one working login per role to credentials.txt (git-ignored)."""
from pathlib import Path

from seedlib import data

FILE = Path(__file__).resolve().parent.parent / "credentials.txt"


def write(api_url: str, super_email: str, super_password: str, password: str) -> None:
    teacher = data.TEACHERS[0]
    student = data.CLASSES["CSE-A-1"][4][0]
    logins = [
        ("SUPER_ADMIN", super_email, super_password),
        ("TENANT_ADMIN", data.ADMINS[0]["email"], password),
        ("ADMIN", data.ADMINS[1]["email"], password),
        ("TEACHER", data.email_for(teacher["first"], teacher["last"]), password),
        ("STUDENT", data.email_for(student["first"], student["last"]), password),
    ]
    lines = [f"API: {api_url}", f"Institution code: {data.TENANT_SLUG}", ""]
    for role, email, secret in logins:
        lines += [f"{role}", f"  email:    {email}", f"  password: {secret}", ""]
    FILE.write_text("\n".join(lines))
