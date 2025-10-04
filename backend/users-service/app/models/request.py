from datetime import datetime
from enum import Enum
from typing import Any, Dict

import uuid6

from .base import Base


class Status(str, Enum):
    waiting = "waiting"
    accepted = "accepted"
    rejected = "rejected"
    canceled = "canceled"


class Type(str, Enum):
    role = "role"


class RequesterType(str, Enum):
    user = "user"


class RequestedType(str, Enum):
    user = "user"


class Request(Base):
    request_id: str = None
    created_at: datetime = None
    type: Type = None
    status: Status = Status.waiting
    requester_id: str = None
    requester_type: RequesterType = None
    requested_id: str = None
    requested_type: RequestedType = None
    subject: str = None
    comment: str = None
    updated_at: datetime = None
    other_data: Dict[str, Any] = None

    @classmethod
    def generate_uuid(cls) -> str:
        return str(uuid6.uuid7())
