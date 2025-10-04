from fastapi import APIRouter

from app.api.v1.endpoints import notifications
from app.api.v1.endpoints.account import api_router as account_router
from app.api.v1.endpoints.observability import api_router as observability_router
from app.api.v1.endpoints.providers import api_router as providers_router
from app.api.v1.endpoints.public import api_router as public_router

api_router = APIRouter()


api_router.include_router(observability_router, tags=["observability"])
api_router.include_router(providers_router, tags=["providers"])
api_router.include_router(public_router, tags=["public"])
api_router.include_router(account_router, tags=["account"])
api_router.include_router(notifications.api_router, tags=["notifications"])
