
"""Observability endpoints for monitoring and health checks."""

from typing import Dict

from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/health")
async def health() -> Dict[str, str]:
    """Health check endpoint.
    
    Returns:
        Simple status confirmation.
    """
    return {"status": "ok"}
