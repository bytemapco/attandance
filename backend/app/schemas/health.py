from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ServiceHealth(BaseModel):
    status: str = Field(description="'healthy', 'degraded', or 'unhealthy'")
    latency_ms: Optional[float] = None
    details: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str = Field(description="'healthy', 'degraded', or 'unhealthy'")
    app_name: str
    environment: str
    version: str
    timestamp: datetime
    services: Dict[str, ServiceHealth]
