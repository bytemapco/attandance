import logging

_SILENCED_LOGGERS = [
    "uvicorn.access",
    "httpx",
    "httpcore",
    "deepface",
    "tensorflow",
    "absl",
    "h5py",
    "PIL",
    "numba",
    "huggingface_hub",
    "filelock",
    "urllib3",
    "werkzeug",
    "asyncio",
]

_FORMAT = logging.Formatter(
    "%(asctime)s [%(levelname)-8s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)


def setup_logging(level: str | None = None) -> None:
    if level is None:
        from app.core.config import settings

        level = settings.LOG_LEVEL

    effective_level = getattr(logging, level.upper(), logging.DEBUG)

    console = logging.StreamHandler()
    console.setFormatter(_FORMAT)

    for logger_name in ["app", "app.access"]:
        logger = logging.getLogger(logger_name)
        logger.setLevel(effective_level)
        logger.propagate = False
        logger.handlers.clear()
        logger.addHandler(console)

    for name in _SILENCED_LOGGERS:
        logging.getLogger(name).setLevel(logging.ERROR)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
