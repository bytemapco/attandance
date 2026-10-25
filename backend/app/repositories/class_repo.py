from typing import List

from prisma.models import AcademicClass
from app.db.client import db


class ClassRepository:
    async def get_by_id(self, class_id: str) -> AcademicClass | None:
        return await db.academicclass.find_unique(where={"id": class_id})

    async def get_by_teacher_id(self, teacher_id: str) -> List[AcademicClass]:
        return await db.academicclass.find_many(where={"teacherId": teacher_id})
