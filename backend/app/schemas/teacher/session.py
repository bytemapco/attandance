from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SessionStart(BaseModel):
    model_config = ConfigDict(extra="forbid")

    academic_class_id: str = Field(..., min_length=1, max_length=64, description="ID of the class to open")
    duration_minutes: int = Field(10, ge=1, le=180, description="How long students can mark attendance, in minutes")


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str = Field(..., description="Session ID")
    academic_class_id: str = Field(..., alias="academicClassId", description="ID of the class this session belongs to")
    start_time: datetime = Field(..., alias="startTime", description="When the session opened")
    end_time: datetime = Field(..., alias="endTime", description="When the session closes")
    is_active: bool = Field(..., alias="isActive", description="Whether students can still mark attendance")
