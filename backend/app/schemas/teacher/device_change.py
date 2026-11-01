from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class DeviceChangeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Device change request ID")
    student_id: str = Field(..., description="Student ID")
    student_name: str = Field(..., description="Student's full name")
    enrollment_number: str = Field(..., description="Student's enrollment number")
    new_device_uuid: str = Field(..., description="ID of the device the student wants to switch to")
    reason: Optional[str] = Field(None, description="Why the student is changing devices")
    status: str = Field(..., description="PENDING, APPROVED or REJECTED")
    approved_by: Optional[str] = Field(None, description="User ID of the teacher who decided the request")
    created_at: datetime = Field(..., description="When the request was made")
    updated_at: datetime = Field(..., description="When the request was last changed")


class DeviceChangeApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["APPROVED", "REJECTED"] = Field(..., description="The teacher's decision")
