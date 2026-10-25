from datetime import datetime, date
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict


class LeaveRequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    start_date: date = Field(..., description="Leave start date")
    end_date: date = Field(..., description="Leave end date")
    reason: str = Field(..., min_length=10, max_length=500, description="Reason for leave")
    document_url: Optional[str] = Field(None, max_length=1000, description="Supporting document URL")

    @field_validator("reason", mode="before")
    @classmethod
    def strip_reason(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v

    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, v: date, info) -> date:
        if "start_date" in info.data and v < info.data["start_date"]:
            raise ValueError("end_date must be after or equal to start_date")
        return v


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
