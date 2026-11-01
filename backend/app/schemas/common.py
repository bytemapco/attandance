from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    status: str = Field(default="success", description="Status code or flag")
    message: str = Field(..., description="Human-readable response message")


class ActionSuccessResponse(BaseModel):
    status: str = Field(default="success", description="Status string")
    message: str = Field(..., description="Action result message")
