from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict


class LeaveRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    student_name: str
    enrollment_number: str
    start_date: datetime
    end_date: datetime
    reason: str
    document_url: Optional[str] = None
    status: str
    approved_by: Optional[str] = None
    approver_note: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LeaveRequestApprove(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["APPROVED", "REJECTED"] = Field(..., description="Approval status")
    approver_note: Optional[str] = Field(None, max_length=300, description="Optional note from approver")

    @field_validator("approver_note", mode="before")
    @classmethod
    def strip_note(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class LeaveRequestListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    leaves: list[LeaveRequestResponse]
    total: int
    pending: int
    approved: int
    rejected: int
