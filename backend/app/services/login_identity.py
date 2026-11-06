"""Finds the account behind a login ID.

An email is unique across the platform. A student's enrollment number and a teacher's employee ID are
only unique inside one institution, so the same ID can belong to people at different institutions.
"""

import asyncio
from typing import List, Optional

from fastapi import HTTPException, status
from prisma.models import User

from app.core.security import verify_password
from app.db.client import db
from app.repositories.user_repository import UserRepository

AMBIGUOUS_ID_MESSAGE = "This ID is used by more than one institution. Enter your institution code and try again."


async def find_candidate_users(identifier: str, tenant_slug: Optional[str] = None) -> List[User]:
    """Every account the identifier could mean. Narrowed to one institution when a slug is given."""
    if "@" in identifier:
        user = await UserRepository().get_by_email(identifier.lower())
        return [user] if user else []

    scope = {"tenant": {"is": {"slug": tenant_slug}}} if tenant_slug else {}
    students = await db.student.find_many(where={"enrollmentNumber": identifier, **scope}, include={"user": True})
    teachers = await db.teacher.find_many(where={"employeeId": identifier, **scope}, include={"user": True})
    users = {profile.user.id: profile.user for profile in [*students, *teachers] if profile.user}
    if users or tenant_slug:
        return list(users.values())

    by_email = await UserRepository().get_by_email(identifier.lower())
    return [by_email] if by_email else []


async def pick_user_by_password(candidates: List[User], password: str) -> Optional[User]:
    """The one candidate whose password matches. Two matches means the ID cannot be told apart."""
    results = await asyncio.gather(*(verify_password(password, user.hashedPassword) for user in candidates))
    matches = [user for user, matched in zip(candidates, results) if matched]
    if len(matches) > 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=AMBIGUOUS_ID_MESSAGE)
    return matches[0] if matches else None
