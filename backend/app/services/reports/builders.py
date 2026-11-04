"""Turns loaded sections into the three reports. No database access, so each is testable with hand-made data."""
from statistics import mean

from app.schemas.reports import (
    RegisterLecture,
    RegisterReport,
    RegisterRow,
    ReportMeta,
    ReportSubject,
    ShortageReport,
    ShortageRow,
    SummaryCell,
    SummaryReport,
    SummaryRow,
)
from app.services.reports.standing import COUNTED_AS_ATTENDED, Standing, classes_needed, combine
from app.services.reports.types import Learner, SectionData

NOT_ENROLLED = "NOT_ENROLLED"


def _cell(part: Standing) -> SummaryCell:
    return SummaryCell(attended=part.attended, held=part.held, percentage=part.percentage)


def _standings_by_student(sections: list[SectionData]) -> dict[str, tuple[Learner, str, list[Standing]]]:
    found: dict[str, tuple[Learner, str, list[Standing]]] = {}
    for section in sections:
        for learner in section.learners:
            _, _, parts = found.setdefault(learner.id, (learner, section.class_code, []))
            parts.append(section.standing_of(learner))
    return found


def build_shortage(sections: list[SectionData], meta: ReportMeta) -> ShortageReport:
    rows: list[ShortageRow] = []
    scored: list[float] = []
    for learner, class_code, parts in _standings_by_student(sections).values():
        total = combine(parts)
        if total.percentage is None:
            continue
        scored.append(total.percentage)
        if total.percentage < meta.threshold:
            rows.append(
                ShortageRow(
                    student_id=learner.id, student_name=learner.name, roll=learner.roll, class_code=class_code,
                    attended=total.attended, held=total.held, percentage=total.percentage,
                    classes_needed=classes_needed(total.attended, total.held, meta.threshold),
                )
            )
    rows.sort(key=lambda row: (row.percentage, row.roll))
    return ShortageReport(
        meta=meta, students_counted=len(scored),
        average_percentage=round(mean(scored), 2) if scored else None, rows=rows,
    )


def build_register(section: SectionData, meta: ReportMeta) -> RegisterReport:
    lectures = sorted(section.lectures, key=lambda lecture: (lecture.day, lecture.start))
    columns = [
        RegisterLecture(
            id=lecture.id, day=lecture.day, start=lecture.start, end=lecture.end,
            present=sum(
                1 for learner in section.learners
                if section.mark(lecture, learner) in COUNTED_AS_ATTENDED and lecture.day >= learner.since
            ),
        )
        for lecture in lectures
    ]
    rows = []
    for learner in sorted(section.learners, key=lambda item: item.roll):
        own = section.standing_of(learner)
        marks = [NOT_ENROLLED if lecture.day < learner.since else section.mark(lecture, learner) for lecture in lectures]
        rows.append(
            RegisterRow(
                student_id=learner.id, student_name=learner.name, roll=learner.roll, marks=marks,
                attended=own.attended, held=own.held, percentage=own.percentage,
            )
        )
    return RegisterReport(meta=meta, lectures=columns, rows=rows)


def build_summary(sections: list[SectionData], meta: ReportMeta) -> SummaryReport:
    ordered = sorted(sections, key=lambda section: section.subject_name)
    members = [{learner.id: learner for learner in section.learners} for section in ordered]
    learners = {learner_id: learner for group in members for learner_id, learner in group.items()}
    rows = []
    for learner in sorted(learners.values(), key=lambda item: item.roll):
        parts = [
            section.standing_of(group[learner.id]) if learner.id in group else None
            for section, group in zip(ordered, members)
        ]
        rows.append(
            SummaryRow(
                student_id=learner.id, student_name=learner.name, roll=learner.roll,
                cells=[_cell(part) if part else None for part in parts],
                overall=_cell(combine([part for part in parts if part])),
            )
        )
    subjects = [
        ReportSubject(
            section_id=section.id, class_code=section.class_code,
            subject_code=section.subject_code, subject_name=section.subject_name,
        )
        for section in ordered
    ]
    return SummaryReport(meta=meta, subjects=subjects, rows=rows)
