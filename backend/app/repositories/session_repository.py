from datetime import datetime

from prisma.models import Session
from app.db.client import db


class SessionRepository:
    async def get_by_id(self, session_id: str) -> Session | None:
        return await db.session.find_unique(where={"id": session_id})

    async def deactivate(self, session_id: str) -> Session:
        return await db.session.update(where={"id": session_id}, data={"isActive": False})

    async def get_sessions_in_date_range(self, start_date: datetime, end_date: datetime):
        return await db.session.find_many(
            where={"startTime": {"gte": start_date, "lte": end_date}},
            include={"academicClass": True},
        )

    async def get_by_class_id(self, class_id: str):
        return await db.session.find_many(where={"academicClassId": class_id}, order={"startTime": "desc"})
