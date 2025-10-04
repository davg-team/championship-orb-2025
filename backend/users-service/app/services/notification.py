import logging
from datetime import datetime
from typing import List

from app.db.base import UoW
from app.models.notification import Notification


class NotificationService:
    def __init__(self, uow: UoW):
        self.uow = uow
        self.notification_repo = uow.notification_repo
        self.logger = logging.getLogger(__name__)

    async def send_notification(self, notification_data: dict) -> Notification:
        try:
            notification = Notification(**notification_data)
            sent_notification = await self.notification_repo.insert(notification)
            await self.uow.commit()
            return sent_notification
        except Exception as e:
            self.logger.error(f"Ошибка при отправке уведомления: {e}")
            raise

    async def get_notifications(self, receiver_id: str) -> List[Notification]:
        try:
            notifications = await self.notification_repo.get_by_receiver_id(receiver_id)
            return notifications
        except Exception as e:
            self.logger.error(f"Ошибка при получении уведомлений: {e}")
            raise

    async def mark_notification_as_read(self, notification_id: str) -> Notification:
        try:
            notification = await self.notification_repo.mark_as_read(notification_id)
            await self.uow.commit()
            return notification
        except Exception as e:
            self.logger.error(f"Ошибка при отметке уведомления как прочитанного: {e}")
            raise

    async def get_notification_by_id(self, notification_id: str) -> Notification:
        try:
            notification = await self.notification_repo.get_by_id(notification_id)
            return notification
        except Exception as e:
            self.logger.error(f"Ошибка при получении уведомления: {e}")
            raise

    async def update_read_status(
        self, notification_id: str, is_read: bool
    ) -> Notification:
        try:
            notification = await self.notification_repo.update_read_status(
                notification_id, datetime.now() if is_read else None
            )
            await self.uow.commit()
            return notification
        except Exception as e:
            self.logger.error(f"Ошибка при обновлении статуса прочтения уведомления: {e}")
            raise
