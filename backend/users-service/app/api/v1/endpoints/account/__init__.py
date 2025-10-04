"""Account management endpoints package."""

from .individual import api_router as individual_router
from .bulk import api_router as bulk_router
from fastapi import APIRouter

# Combine all account-related routers
api_router = APIRouter()
api_router.include_router(individual_router)
api_router.include_router(bulk_router)