"""Individual account management endpoints."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.tools import authorize
from app.api.v1.endpoints.providers import JWTSchema
from app.core.dependencies import get_crypto_manager, get_user_service
from app.core.tokens import user_to_token_claims
from app.services.user import UserService

from ...schemas.account import UpdateAccountSchema

api_router = APIRouter()


@api_router.put("/account/update")
@authorize()
async def update_account(
    data: UpdateAccountSchema,
    request: Request,
    user_service: UserService = Depends(get_user_service),
) -> dict[str, str]:
    """Update current user account information.
    
    Args:
        data: Account update data.
        request: HTTP request containing user state.
        user_service: User service dependency.
        
    Returns:
        Status confirmation.
        
    Raises:
        HTTPException: If user is not authenticated.
    """
    try:
        user = request.state.user
    except Exception as e:
        logging.error(e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from e

    for key, value in data.model_dump().items():
        if value is not None:
            setattr(user, key, value)

    await user_service.update_user(user)

    return {"status": "ok"}


@api_router.get("/account/token")
@authorize()
async def update_token(
    request: Request,
    user_service: UserService = Depends(get_user_service),
) -> JWTSchema:
    """Refresh JWT token for the current user.
    
    Args:
        request: HTTP request containing JWT state.
        user_service: User service dependency.
        
    Returns:
        New JWT token.
        
    Raises:
        HTTPException: If token refresh fails.
    """
    try:
        jwt = request.state.jwt
        user_id = jwt["sub"]
        user = await user_service.get_user_by_id(user_id)
        data = user_to_token_claims(user)
        crypto_manager = get_crypto_manager()
        jwt_token = crypto_manager.create_signed_jwt(data)
        return JWTSchema(access_token=jwt_token)
    except Exception as e:
        logging.error(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update token",
        ) from e