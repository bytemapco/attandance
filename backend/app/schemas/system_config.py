from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SystemConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    is_face_recognition_enabled: bool = Field(..., alias="isFaceRecognitionEnabled")
    is_gps_verification_enabled: bool = Field(..., alias="isGpsVerificationEnabled")
    is_ai_background_validation_enabled: bool = Field(..., alias="isAiBackgroundValidationEnabled")
    campus_latitude: Optional[float] = Field(None, alias="campusLatitude", description="Null until set in Settings")
    campus_longitude: Optional[float] = Field(None, alias="campusLongitude", description="Null until set in Settings")
    geofence_radius_meters: int = Field(..., alias="geofenceRadiusMeters")
    min_attendance_pct: float = Field(..., alias="minAttendancePct", description="Eligibility threshold, 0 to 100")
    verification_window_min: int = Field(..., alias="verificationWindowMin", description="Minutes attendance stays open")
    saturday_enabled: bool = Field(..., alias="saturdayEnabled")


class SystemConfigUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    is_face_recognition_enabled: Optional[bool] = Field(None, alias="isFaceRecognitionEnabled")
    is_gps_verification_enabled: Optional[bool] = Field(None, alias="isGpsVerificationEnabled")
    is_ai_background_validation_enabled: Optional[bool] = Field(None, alias="isAiBackgroundValidationEnabled")
    campus_latitude: Optional[float] = Field(None, ge=-90, le=90, alias="campusLatitude")
    campus_longitude: Optional[float] = Field(None, ge=-180, le=180, alias="campusLongitude")
    geofence_radius_meters: Optional[int] = Field(None, gt=0, le=5000, alias="geofenceRadiusMeters")
    min_attendance_pct: Optional[float] = Field(None, ge=0.0, le=100.0, alias="minAttendancePct")
    verification_window_min: Optional[int] = Field(None, ge=5, le=360, alias="verificationWindowMin")
    saturday_enabled: Optional[bool] = Field(None, alias="saturdayEnabled")
