import os
from typing import Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.getenv("ENV_FILE", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Smart Attendance System API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = Field(
        default="", description="PostgreSQL Connection URL (must be set via environment variable)"
    )
    JWT_SECRET: str = Field(description="JWT signing secret (must be set in production)")

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        if not value:
            raise ValueError("JWT_SECRET environment variable is required.")
        return value

    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    TOKEN_REVOCATION_FAIL_CLOSED: bool = False
    REDIS_URL: str = "redis://localhost:6379/0"

    # AWS S3 Storage
    AWS_ENDPOINT_URL: Optional[str] = None
    AWS_REGION: Optional[str] = None
    AWS_DEFAULT_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET_NAME: str = ""
    AWS_S3_BUCKET_NAME: Optional[str] = None

    @property
    def resolved_aws_region(self) -> str:
        return self.AWS_REGION or self.AWS_DEFAULT_REGION

    @property
    def resolved_s3_bucket(self) -> str:
        return self.AWS_S3_BUCKET_NAME or self.S3_BUCKET_NAME

    # SMTP Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    EMAILS_FROM_EMAIL: str = "noreply@smartattendance.edu"
    EMAILS_FROM_NAME: str = "Smart Attendance System"
    INVITATION_TOKEN_EXPIRE_HOURS: int = 48
    RESET_TOKEN_EXPIRE_MINUTES: int = 15

    FRONTEND_URL: str = Field(
        default="http://localhost:3000", description="Frontend URL or comma-separated URLs for CORS"
    )
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = Field(default="DEBUG", description="Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL")

    # AI Compute & Hardware Configuration (GPU / CPU)
    AI_DEVICE: str = Field(
        default="auto",
        description="AI compute target device: 'auto' (detect GPU with fallback), 'cuda' (force GPU), or 'cpu'",
    )
    AI_GPU_MEMORY_LIMIT_MB: Optional[int] = Field(
        default=None, description="Optional hard cap on GPU VRAM allocation in MB (default: dynamic growth)"
    )

    @field_validator("AI_GPU_MEMORY_LIMIT_MB", mode="before")
    @classmethod
    def validate_gpu_memory_limit(cls, value: object) -> Optional[int]:
        if value is None or (isinstance(value, str) and not value.strip()):
            return None
        return int(value)

    AI_FORCE_CPU_FALLBACK: bool = Field(
        default=True, description="Automatically fallback to CPU if GPU driver/libraries are unavailable"
    )


settings = Settings()
