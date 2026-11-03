from typing import List

from prisma.models import Student
from app.db.client import db


def taught_by(teacher_id: str) -> dict:
    """A Student filter: enrolled in a subject this teacher is assigned to."""
    return {
        "courseEnrollments": {
            "some": {
                "status": "ACTIVE",
                "endedAt": None,
                "courseSection": {"is": {"faculties": {"some": {"teacherId": teacher_id}}}},
            }
        }
    }


class StudentRepository:
    async def get_by_id(self, student_id: str) -> Student | None:
        return await db.student.find_unique(where={"id": student_id}, include={"user": True})

    async def get_by_user_id(self, user_id: str) -> Student | None:
        return await db.student.find_unique(where={"userId": user_id}, include={"user": True})

    async def update_face_embedding(self, student_id: str, embedding: List[float]) -> bool:
        await db.execute_raw("UPDATE students SET face_embedding = $1::vector WHERE id = $2", embedding, student_id)
        return True

    async def clear_face_embedding(self, student_id: str) -> None:
        await db.execute_raw("UPDATE students SET face_embedding = NULL WHERE id = $1", student_id)

    async def get_face_embedding(self, student_id: str) -> List[float] | None:
        records = await db.query_raw("SELECT face_embedding::text FROM students WHERE id = $1", student_id)
        if not records or not records[0].get("face_embedding"):
            return None
        val = records[0]["face_embedding"]
        if isinstance(val, list):
            return [float(x) for x in val]
        if isinstance(val, str):
            cleaned = val.strip("[]")
            return [float(x) for x in cleaned.split(",")] if cleaned else []
        return None

    async def update_streak(self, student_id: str, current_streak: int, highest_streak: int) -> bool:
        await db.student.update(
            where={"id": student_id},
            data={"currentStreak": current_streak, "highestStreak": highest_streak},
        )
        return True
