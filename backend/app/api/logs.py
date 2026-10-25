import logging

from fastapi import APIRouter, Depends, Request, status
from prisma.models import User

from app.api.dependencies import get_current_user, auth_rate_limit
from app.core.logging_config import get_logger
from app.schemas.log import LogEvent
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/logs", tags=["Logging"])

logger = get_logger("app.client")


@router.post("", response_model=MessageResponse, status_code=status.HTTP_200_OK)
async def ingest_log(
    log_event: LogEvent,
    request: Request,
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    await auth_rate_limit(request)
    logger.log(
        getattr(logging, log_event.level.upper(), logging.INFO),
        "[%s] [%s] (user:%s) %s",
        log_event.source,
        log_event.timestamp,
        current_user.email,
        log_event.message,
    )
    return MessageResponse(status="success", message="Log ingested successfully.")
