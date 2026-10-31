from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class DepartmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    head: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=255)

    @field_validator("name", "code", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class DepartmentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    head: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    code: str
    head: Optional[str] = None
    description: Optional[str] = None
    classCount: int = 0



class SubjectCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=255)
    department_id: Optional[str] = Field(None, max_length=64)

    @field_validator("name", "code", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class SubjectUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=255)
    department_id: Optional[str] = Field(None, max_length=64)


class ClassroomCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=1, max_length=50)
    building: Optional[str] = Field(None, max_length=100)

    @field_validator("name", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class ClassroomUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=50)
    building: Optional[str] = Field(None, max_length=100)


class DesignationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=255)

    @field_validator("name", "code", mode="before")
    @classmethod
    def strip_text(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class DesignationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    description: Optional[str] = Field(None, max_length=255)
