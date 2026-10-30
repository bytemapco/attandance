"""Aggregated authentic Indian dataset exports."""

from .data_master import (
    CLASSROOMS,
    DEPARTMENTS,
    DESIGNATIONS,
    INSTITUTIONS,
    SUBJECTS,
)
from .data_people import (
    STUDENTS,
    TEACHERS,
)

__all__ = [
    "INSTITUTIONS",
    "DEPARTMENTS",
    "DESIGNATIONS",
    "CLASSROOMS",
    "SUBJECTS",
    "TEACHERS",
    "STUDENTS",
]
