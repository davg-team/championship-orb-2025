from typing import Any

from uvicorn.workers import UvicornWorker as BaseUvicornWorker

try:
    import uvloop  # (Found nested import)
except ImportError:
    uvloop = None  # type: ignore  # (variables overlap)


class UvicornWorker(BaseUvicornWorker):
    """
    Configuration for uvicorn workers.

    This class is subclassing UvicornWorker and defines
    some parameters class-wide, because it's impossible,
    to pass these parameters through gunicorn.
    """

    CONFIG_KWARGS: dict[str, Any] = {  # typing: ignore  # noqa: RUF012
        "loop": "uvloop" if uvloop is not None else "asyncio",
        "http": "httptools",
        "lifespan": "on",
        "factory": True,
        "proxy_headers": False,
    }
