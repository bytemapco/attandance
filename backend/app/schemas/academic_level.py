from pydantic import BaseModel, ConfigDict, Field

MAX_LEVEL_NUMBER = 30


class AcademicLevelCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    number: int = Field(..., ge=1, le=MAX_LEVEL_NUMBER, description="Position in the course, e.g. 3 for Semester 3")
    name: str = Field(..., min_length=1, max_length=50, description="Display name, e.g. Semester 3")
    is_final: bool = Field(False, description="True for the last semester")


class AcademicLevelUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(None, min_length=1, max_length=50)
    is_final: bool | None = None


class AcademicLevelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: str
    number: int
    name: str
    is_final: bool = Field(..., validation_alias="isFinal")
