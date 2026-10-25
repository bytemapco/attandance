from app.core.config import settings
from app.core.logging_config import get_logger
from prisma import Prisma

logger = get_logger("app.db")

db = Prisma(datasource={"url": settings.DATABASE_URL} if settings.DATABASE_URL else None)


async def connect_db() -> None:
    try:
        await db.connect()
        logger.info("Connected to database")
    except Exception as e:
        logger.error("Failed to connect to database: %s", e, exc_info=True)
        raise


async def disconnect_db() -> None:
    try:
        if db.is_connected():
            await db.disconnect()
    except Exception as e:
        logger.error("Error disconnecting database: %s", e, exc_info=True)
