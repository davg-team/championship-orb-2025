from datetime import datetime
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel


class Notification(BaseModel):
    id: str = None
    type: str = None
    text: str = None
    sender: str = None
    receiver_id: str = None
    sent_at: datetime = None
    read_at: Optional[datetime] = None

    def generate_id(self):
        self.id = str(uuid4())
        return self.id
