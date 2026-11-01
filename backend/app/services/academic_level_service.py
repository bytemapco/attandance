"""The semesters an institution runs (master data). Semester numbers elsewhere must exist here."""
from typing import Optional
from fastapi import HTTPException, status
from prisma.models import AcademicLevel
from app.db.client import db

DEFAULT_SEMESTER_COUNT = 8


def _reject(code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=code, detail=detail)


async def seed_default_levels(tenant_id: str) -> None:
    """Gives a new institution Semester 1-8 so it can create classes straight away."""
    for number in range(1, DEFAULT_SEMESTER_COUNT + 1):
        await db.academiclevel.create(
            data={
                "tenantId": tenant_id,
                "number": number,
                "name": f"Semester {number}",
                "isFinal": number == DEFAULT_SEMESTER_COUNT,
            }
        )


async def list_levels(tenant_id: str) -> list[AcademicLevel]:
    return await db.academiclevel.find_many(where={"tenantId": tenant_id}, order={"number": "asc"})


async def level_numbers(tenant_id: str) -> set[int]:
    return {level.number for level in await list_levels(tenant_id)}


async def require_level(tenant_id: str, number: Optional[int]) -> None:
    """Rejects a semester number that the institution has not set up. None means 'not set' and passes."""
    if number is None:
        return
    if number not in await level_numbers(tenant_id):
        raise _reject(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Semester {number} is not set up. Add it under Master Data, Semesters.",
        )


async def next_level(tenant_id: str, number: int) -> Optional[AcademicLevel]:
    """The level a class moves up to, or None when this is the final level."""
    current = await db.academiclevel.find_first(where={"tenantId": tenant_id, "number": number})
    if current and current.isFinal:
        return None
    return await db.academiclevel.find_first(
        where={"tenantId": tenant_id, "number": {"gt": number}}, order={"number": "asc"}
    )


async def _clear_other_finals(tenant_id: str, keep_id: str) -> None:
    await db.academiclevel.update_many(
        where={"tenantId": tenant_id, "isFinal": True, "id": {"not": keep_id}}, data={"isFinal": False}
    )


async def create_level(tenant_id: str, number: int, name: str, is_final: bool) -> AcademicLevel:
    if await db.academiclevel.find_first(where={"tenantId": tenant_id, "number": number}):
        raise _reject(status.HTTP_409_CONFLICT, f"Semester {number} already exists.")
    level = await db.academiclevel.create(
        data={"tenantId": tenant_id, "number": number, "name": name.strip(), "isFinal": is_final}
    )
    if is_final:
        await _clear_other_finals(tenant_id, level.id)
    return level


async def _get_level(tenant_id: str, level_id: str) -> AcademicLevel:
    level = await db.academiclevel.find_first(where={"id": level_id, "tenantId": tenant_id})
    if not level:
        raise _reject(status.HTTP_404_NOT_FOUND, "Semester not found.")
    return level


async def update_level(tenant_id: str, level_id: str, name: Optional[str], is_final: Optional[bool]) -> AcademicLevel:
    await _get_level(tenant_id, level_id)
    data: dict = {}
    if name is not None:
        data["name"] = name.strip()
    if is_final is not None:
        data["isFinal"] = is_final
    level = await db.academiclevel.update(where={"id": level_id}, data=data)
    if is_final:
        await _clear_other_finals(tenant_id, level.id)
    return level


async def _in_use(tenant_id: str, number: int) -> bool:
    students = await db.student.count(where={"tenantId": tenant_id, "semester": number})
    classes = await db.studentgroup.count(where={"tenantId": tenant_id, "semester": number})
    return bool(students or classes)


async def delete_level(tenant_id: str, level_id: str) -> None:
    level = await _get_level(tenant_id, level_id)
    if await _in_use(tenant_id, level.number):
        raise _reject(
            status.HTTP_409_CONFLICT,
            f"Semester {level.number} is used by students or classes, so it cannot be deleted.",
        )
    await db.academiclevel.delete(where={"id": level_id})
