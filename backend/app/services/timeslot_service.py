from fastapi import HTTPException, status
from app.db.client import db
from app.schemas.academic_year import TimeSlotCreate, TimeSlotUpdate


class TimeSlotService:
    @staticmethod
    async def create_time_slot(tenant_id: str, data: TimeSlotCreate):
        existing = await db.timeslot.find_first(
            where={"tenantId": tenant_id, "slotNumber": data.slot_number}
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Slot number {data.slot_number} already exists for this institution.",
            )
        return await db.timeslot.create(
            data={
                "tenantId": tenant_id,
                "slotNumber": data.slot_number,
                "name": data.name,
                "startTime": data.start_time,
                "endTime": data.end_time,
                "isBreak": data.is_break,
                "isLabBlock": data.is_lab_block,
            }
        )

    @staticmethod
    async def list_time_slots(tenant_id: str):
        return await db.timeslot.find_many(
            where={"tenantId": tenant_id},
            order={"slotNumber": "asc"},
        )

    @staticmethod
    async def get_time_slot(tenant_id: str, slot_id: str):
        slot = await db.timeslot.find_first(where={"id": slot_id, "tenantId": tenant_id})
        if not slot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Time slot not found.")
        return slot

    @staticmethod
    async def update_time_slot(tenant_id: str, slot_id: str, data: TimeSlotUpdate):
        await TimeSlotService.get_time_slot(tenant_id, slot_id)
        update_data = {}
        if data.slot_number is not None:
            update_data["slotNumber"] = data.slot_number
        if data.name is not None:
            update_data["name"] = data.name
        if data.start_time is not None:
            update_data["startTime"] = data.start_time
        if data.end_time is not None:
            update_data["endTime"] = data.end_time
        if data.is_break is not None:
            update_data["isBreak"] = data.is_break
        if data.is_lab_block is not None:
            update_data["isLabBlock"] = data.is_lab_block

        return await db.timeslot.update(where={"id": slot_id}, data=update_data)

    @staticmethod
    async def delete_time_slot(tenant_id: str, slot_id: str):
        await TimeSlotService.get_time_slot(tenant_id, slot_id)
        await db.timeslot.delete(where={"id": slot_id})
        return {"success": True, "message": "Time slot deleted successfully."}

    @staticmethod
    async def seed_standard_indian_schedule(tenant_id: str):
        existing_count = await db.timeslot.count(where={"tenantId": tenant_id})
        if existing_count > 0:
            return await TimeSlotService.list_time_slots(tenant_id)

        standard_slots = [
            {"slotNumber": 1, "name": "Period 1", "startTime": "09:00", "endTime": "10:00", "isBreak": False, "isLabBlock": False},
            {"slotNumber": 2, "name": "Period 2", "startTime": "10:00", "endTime": "11:00", "isBreak": False, "isLabBlock": False},
            {"slotNumber": 3, "name": "Recess", "startTime": "11:00", "endTime": "11:15", "isBreak": True, "isLabBlock": False},
            {"slotNumber": 4, "name": "Period 3", "startTime": "11:15", "endTime": "12:15", "isBreak": False, "isLabBlock": False},
            {"slotNumber": 5, "name": "Period 4", "startTime": "12:15", "endTime": "13:00", "isBreak": False, "isLabBlock": False},
            {"slotNumber": 6, "name": "Lunch Break", "startTime": "13:00", "endTime": "13:45", "isBreak": True, "isLabBlock": False},
            {"slotNumber": 7, "name": "Lab Block / Afternoon Period", "startTime": "13:45", "endTime": "16:45", "isBreak": False, "isLabBlock": True},
        ]
        created = []
        for s in standard_slots:
            item = await db.timeslot.create(data={"tenantId": tenant_id, **s})
            created.append(item)
        return created
