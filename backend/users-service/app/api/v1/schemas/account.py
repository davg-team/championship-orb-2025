from enum import Enum
from typing import Optional

from pydantic import BaseModel


class Role(str, Enum):
    admin = "admin"
    editor = "editor"
    user = "user"


class UpdateAccountSchema(BaseModel):
    first_name: Optional[str]
    last_name: Optional[str]
    second_name: Optional[str]
    phone: Optional[str]
    tg_id: Optional[str]
    notification_ways: Optional[list]
