from prisma.models import AcademicClass
from app.db.client import db


class ClassRepository:
    async def get_by_id(self, class_id: str) -> AcademicClass | None:
        return await db.academicclass.find_unique(where={"id": class_id})
