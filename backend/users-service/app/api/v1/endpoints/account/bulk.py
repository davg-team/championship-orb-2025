"""Bulk account operations endpoints."""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel

from app.core.dependencies import get_user_service
from app.models.user import User
from app.services.user import UserService

api_router = APIRouter()


class UserSchema(BaseModel):
    id: Optional[str]
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]


@api_router.post("/accounts/get")
async def get_accounts(
    request: Request,
    ids: list[str],
    user_service: UserService = Depends(get_user_service),
) -> list[UserSchema]:
    """Get multiple user accounts by their IDs.

    Args:
        request: HTTP request.
        ids: List of user IDs to retrieve.
        user_service: User service dependency.

    Returns:
        List of user accounts.

    Raises:
        HTTPException: If retrieval fails.
    """
    try:
        users = []
        for user in await user_service.get_users_by_ids(ids):
            user_schema = UserSchema(
                id=user.id,
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
            )
            users.append(user_schema)

        return users
    except Exception as e:
        logging.error(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve accounts",
        ) from e


@api_router.get("/accounts/download")
async def download_accounts(
    date_filter: Optional[str] = Query(None, description="Date filter (e.g., 'last_30')"),
    created_after: Optional[datetime] = None,
    region_id: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    user_service: UserService = Depends(get_user_service),
) -> list[UserSchema]:
    """Download user accounts based on filters.

    Args:
        date_filter: Date-based filter.
        created_after: Filter users created after this date.
        region_id: Filter by region ID.
        role: Filter by user role.
        status: Filter by user status.
        user_service: User service dependency.

    Returns:
        List of filtered user accounts.
    """
    users = []

    for user in await user_service.get_users_by_filters(
        date_filter=date_filter,
        created_after=created_after,
        region_id=region_id,
        role=role,
        status_=status,
    ):
        user_schema = UserSchema(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
        )
        users.append(user_schema)

    return users
