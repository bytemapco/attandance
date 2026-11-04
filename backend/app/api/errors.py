from functools import wraps

from fastapi import HTTPException


def value_error_as(status_code: int):
    """Reports a ValueError raised by a service as an HTTP error carrying the same message."""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except ValueError as err:
                raise HTTPException(status_code=status_code, detail=str(err)) from err

        return wrapper

    return decorator
