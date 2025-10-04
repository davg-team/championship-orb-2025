from datetime import datetime
from typing import Optional

from .base import Base


class Relation(Base):
    id: str
    provider_slug: str
    provider_user_id: str
    provider_service: Optional[str]
    user_id: str
    linked_at: datetime
    used_at: Optional[datetime]
