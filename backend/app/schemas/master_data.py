from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator


class SubjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=100, description="Subject name")
    code: str = Field(..., min_length=2, max_length=20, description="Unique subject code e.g. CS101")
    description: Optional[str] = Field(None, max_length=500, description="Optional subject overview")
    department_id: Optional[str] = Field(None, description="Associated academic department ID")

    @field_validator("name", "code", mode="before")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class SubjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=500)
    department_id: Optional[str] = Field(None, description="Associated academic department ID")

    @field_validator("name", "code", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class SubjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    description: Optional[str] = None
    department_id: Optional[str] = None


class ClassroomCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, max_length=100, description="Room number or hall name")
    building: Optional[str] = Field(None, max_length=100, description="Campus block / building")

    @field_validator("name", "building", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class ClassroomUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    building: Optional[str] = Field(None, max_length=100)

    @field_validator("name", "building", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class ClassroomResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    building: Optional[str] = None


class DesignationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=100, description="Designation title")
    code: str = Field(..., min_length=2, max_length=20, description="Short code e.g. ASST_PROF")
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("name", "code", mode="before")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class DesignationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("name", "code", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class DesignationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    description: Optional[str] = None
