"""What the reports are built from: closed classes, the students in them and what was recorded."""
from dataclasses import dataclass, field
from datetime import date
from typing import Optional

from app.services.reports.standing import Standing, standing


@dataclass(frozen=True)
class Lecture:
    id: str
    day: date
    start: str
    end: str


@dataclass(frozen=True)
class Learner:
    id: str
    name: str
    roll: str
    since: date  # the day they joined this subject; earlier classes are not counted for them


@dataclass
class SectionData:
    id: str
    class_code: str
    subject_code: str
    subject_name: str
    lectures: list[Lecture]
    learners: list[Learner]
    marks: dict[tuple[str, str], str] = field(default_factory=dict)  # (lecture id, student id) -> status

    def held_for(self, learner: Learner) -> list[Lecture]:
        return [lecture for lecture in self.lectures if lecture.day >= learner.since]

    def mark(self, lecture: Lecture, learner: Learner) -> Optional[str]:
        return self.marks.get((lecture.id, learner.id))

    def standing_of(self, learner: Learner) -> Standing:
        return standing([self.mark(lecture, learner) for lecture in self.held_for(learner)])
