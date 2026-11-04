from fastapi import Request


def get_client_ip(request: Request) -> str:
    """The peer address of the connection. Proxy headers are not trusted here: when the app runs behind a
    reverse proxy, uvicorn applies `X-Forwarded-For` itself, and only for the proxies it is told to trust."""
    if request.client and request.client.host:
        return request.client.host
    return "unknown"
