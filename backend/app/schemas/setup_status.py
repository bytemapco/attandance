from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SetupCheck(BaseModel):
    """One thing a tenant needs before attendance can run."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    required: bool
    done: bool
    count: Optional[int] = Field(None, description="How many exist now, when the item is a list")
    blocker_message: Optional[str] = Field(None, description="Plain-language reason shown while the item is not done")
    href: str = Field(..., description="Where in the admin panel the item is completed")


class SetupStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_name: str
    tenant_type: str
    checks: list[SetupCheck]
    required_done: int
    required_total: int
    score: int = Field(..., ge=0, le=100, description="Percentage of required items done")
    ready_to_complete: bool
    completed: bool
    completed_at: Optional[datetime] = None
    license_remaining: Optional[int] = Field(None, description="Seats left, null if unknown")


class SetupIncompleteDetail(BaseModel):
    message: str
    missing: list[str]
