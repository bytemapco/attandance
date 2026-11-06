"""Starter questions shown in an empty chat."""
from app.services.agent.types import ADMIN

ADMIN_STARTERS = [
    "What is still left to set up?",
    "Which classes dropped most in attendance this month?",
    "How many leave requests are waiting?",
    "List students below the minimum in a class",
    "How do I create a class?",
]
TEACHER_STARTERS = [
    "What is my schedule today?",
    "Who is at risk in my classes?",
    "Do I have flagged scans to review?",
    "Do I have leave requests waiting?",
    "Draft a reminder to students with low attendance",
]


def suggestions_for(role: str) -> list[str]:
    return list(ADMIN_STARTERS if role == ADMIN else TEACHER_STARTERS)
