from typing import TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class MessageResponse(BaseModel):
    status: str = Field(default="success", description="Status code or flag")
    message: str = Field(..., description="Human-readable response message")


class ActionSuccessResponse(BaseModel):
    status: str = Field(default="success", description="Status string")
    message: str = Field(..., description="Action result message")


class BulkActionCountResponse(BaseModel):
    status: str = Field(default="success", description="Status string")
    count: int = Field(..., ge=0, description="Count of modified or processed items")


class ValidationErrorDetail(BaseModel):
    field: str = Field(..., description="Field path that triggered the error")
    issue: str = Field(..., description="Validation failure explanation")


class ValidationErrorEnvelopeBody(BaseModel):
    code: str = Field(default="VALIDATION_ERROR", description="Standard error code")
    message: str = Field(default="Invalid request payload", description="General error summary")
    details: list[ValidationErrorDetail] = Field(
        default_factory=list, description="List of granular field validation errors"
    )


class ValidationErrorEnvelope(BaseModel):
    success: bool = Field(default=False, description="Success flag")
    error: ValidationErrorEnvelopeBody = Field(..., description="Error payload details")
