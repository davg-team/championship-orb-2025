"""User service providing business logic for user operations."""

from datetime import datetime
from typing import Any, Optional

from app.db.base import UoW
from app.models.user import User


class UserService:
    """Service class handling user-related business operations."""
    
    def __init__(self, uow: UoW) -> None:
        """Initialize UserService with unit of work.
        
        Args:
            uow: Unit of work instance for database operations.
        """
        self.repository = uow.user_repo

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID.
        
        Args:
            user_id: The unique identifier of the user.
            
        Returns:
            User instance if found, None otherwise.
        """
        return await self.repository.get_by_id(user_id)

    async def update_user(self, user: User) -> User:
        """Update user information.
        
        Args:
            user: User instance with updated information.
            
        Returns:
            Updated user instance.
        """
        return await self.repository.update(user)

    async def get_user_notification_settings(self, user_id: str) -> Optional[dict[str, Any]]:
        """Get notification settings for a specific user.
        
        Args:
            user_id: The unique identifier of the user.
            
        Returns:
            Dictionary containing notification settings.
        """
        return await self.repository.get_user_notification_settings(user_id)

    async def get_users_notification_settings(self, fsp: str) -> list[dict[str, Any]]:
        """Get notification settings for users in a federal subject (FSP).
        
        Args:
            fsp: Federal subject identifier ("0" for federal level).
            
        Returns:
            List of user notification settings.
        """
        if fsp == "0":
            roles = ["root", "fsp_staff"]
        else:
            roles = ["root", "fsp_staff", "fsp_head"]
        return await self.repository.get_users_notification_settings(
            region_id=fsp, roles=roles
        )

    async def get_users_by_ids(self, ids: list[str]) -> list[User]:
        """Get multiple users by their IDs.
        
        Args:
            ids: List of user identifiers.
            
        Returns:
            List of User instances.
        """
        return await self.repository.get_users_by_ids(ids)

    async def get_users_by_filters(
        self,
        date_filter: Optional[str] = None,
        created_after: Optional[datetime] = None,
        region_id: Optional[str] = None,
        role: Optional[str] = None,
        status_: Optional[str] = None,
    ) -> list[User]:
        """Get users by applying various filters.
        
        Args:
            date_filter: Date-based filter (e.g., "last_30").
            created_after: Filter users created after this date.
            region_id: Filter by region identifier.
            role: Filter by user role.
            status_: Filter by user status.
            
        Returns:
            List of User instances matching the filters.
        """
        return await self.repository.get_users_by_filters(
            date_filter=date_filter,
            created_after=created_after,
            region_id=region_id,
            role=role,
            status_=status_,
        )
