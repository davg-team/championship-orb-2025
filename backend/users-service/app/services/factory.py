from app.db.base import UoW

from .notification import NotificationService
from .relation import RelationService
from .user import UserService


class ServicesFactory:
    def __init__(self, uow: UoW):
        self.uow = uow

    def get_user_service(self) -> UserService:
        return UserService(self.uow)

    def get_relation_service(self) -> RelationService:
        return RelationService(self.uow)

    def get_notification_service(self) -> NotificationService:
        return NotificationService(self.uow)
