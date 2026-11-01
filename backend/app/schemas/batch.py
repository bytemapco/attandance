from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

SECTION_PATTERN = r"^[A-Z]$"
MAX_BATCH_NUMBER = 99


class BatchCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    section: str = Field(..., pattern=SECTION_PATTERN, description="Section letter A-Z")
    number: Optional[int] = Field(
        None, ge=1, le=MAX_BATCH_NUMBER, description="Explicit batch number; defaults to the next free number"
    )


class BatchStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["ACTIVE", "ARCHIVED"]


class BatchResponse(BaseModel):
    id: str
    department_id: str
    section: str
    number: int
    code: str = Field(..., description="Batch code such as CE-A-1")
    status: str
    student_count: int = 0
    class_count: int = 0
    created_at: datetime
    updated_at: datetime


