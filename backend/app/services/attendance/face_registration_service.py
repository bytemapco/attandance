from typing import Union
from app.repositories.student_repository import StudentRepository
from app.services.ai_orchestrator import AIOrchestrator


class FaceRegistrationService:
    def __init__(
        self,
        student_repo: StudentRepository | None = None,
        ai_orchestrator: AIOrchestrator | None = None,
    ) -> None:
        self.student_repo = student_repo or StudentRepository()
        self.ai_orchestrator = ai_orchestrator or AIOrchestrator()

    async def register_face(self, student_id: str, image_input: Union[str, bytes]) -> bool:
        embedding = await self.ai_orchestrator.extract_face_embedding(image_input)
        if not embedding:
            return False
        await self.student_repo.update_face_embedding(student_id, embedding)
        return True
