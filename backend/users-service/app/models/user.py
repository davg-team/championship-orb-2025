from datetime import datetime
from enum import Enum
from typing import Any, Optional

import uuid6

from .base import Base


class Role(str, Enum):
    """User role enumeration."""
    admin = "admin"
    editor = "editor"
    user = "user"


class Status(str, Enum):
    """User status enumeration."""
    active = "active"
    inactive = "inactive"
    blocked = "blocked"
    validation = "validation"


class User(Base):
    """User model with comprehensive user information."""
    
    id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    second_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    region_id: Optional[str] = None
    tg_id: Optional[str] = None
    snils: Optional[str] = None
    role: Role = Role.user
    status: Optional[Status] = None
    required: list[str] = []
    notification_ways: list[str] = []
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    other_data: dict[str, Any] = {}

    @classmethod
    def generate_user_id(cls) -> str:
        """Generate a new UUID7 for user ID."""
        return str(uuid6.uuid7())
