from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SystemConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    is_face_recognition_enabled: bool = Field(..., alias="isFaceRecognitionEnabled")
    is_gps_verification_enabled: bool = Field(..., alias="isGpsVerificationEnabled")
    is_ai_background_validation_enabled: bool = Field(..., alias="isAiBackgroundValidationEnabled")


class SystemConfigUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    is_face_recognition_enabled: Optional[bool] = Field(None, alias="isFaceRecognitionEnabled")
    is_gps_verification_enabled: Optional[bool] = Field(None, alias="isGpsVerificationEnabled")
    is_ai_background_validation_enabled: Optional[bool] = Field(None, alias="isAiBackgroundValidationEnabled")
