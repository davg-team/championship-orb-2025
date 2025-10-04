import logging
from datetime import datetime

from app.db.ydb.repository import BaseRepository
from app.models.notification import Notification


class NotificationRepository(BaseRepository):
    notification_table = "notifications"

    CREATE_NOTIFICATIONS_TABLE = f"""
        CREATE TABLE {notification_table}
        (
            id Utf8,
            type Utf8,
            text Utf8,
            sender_id Utf8,
            receiver_id Utf8,
            sent_at Datetime,
            read_at Datetime?,
            PRIMARY KEY (id)
        );
    """

    async def insert(self, notification: Notification) -> Notification:
        QUERY = f"""
        DECLARE $id AS Utf8;
        DECLARE $type AS Utf8;
        DECLARE $text AS Utf8;
        DECLARE $sender AS Utf8;
        DECLARE $receiver_id AS Utf8;
        DECLARE $sent_at AS Datetime;
        DECLARE $read_at AS Datetime?;

        INSERT INTO {self.notification_table}
        (id, type, text, sender_id, receiver_id, sent_at, read_at)
        VALUES
        ($id, $type, $text, $sender, $receiver_id, $sent_at, $read_at);
        """

        if not notification.id:
            notification.generate_id()

        if not notification.sent_at:
            notification.sent_at = datetime.now()

        async with self:
            await self.execute(
                QUERY,
                {
                    "$id": notification.id,
                    "$type": notification.type,
                    "$text": notification.text,
                    "$sender": notification.sender,
                    "$receiver_id": notification.receiver_id,
                    "$sent_at": int(notification.sent_at.timestamp()),
                    "$read_at": int(notification.read_at.timestamp())
                    if notification.read_at
                    else None,
                },
                # commit_tx=True,
            )

        return notification

    async def get_by_receiver_id(self, receiver_id: str) -> list[Notification]:
        QUERY = f"""
        DECLARE $receiver_id AS Utf8;
        SELECT * FROM {self.notification_table} WHERE receiver_id = $receiver_id;
        """
        async with self:
            (result,) = await self.execute(QUERY, {"$receiver_id": receiver_id})

        notifications = []
        for row in result.rows:
            notification = Notification(
                id=row.id,
                type=row.type,
                text=row.text,
                sender=row.sender_id,
                receiver_id=row.receiver_id,
                sent_at=datetime.fromtimestamp(row.sent_at),
                read_at=datetime.fromtimestamp(row.read_at) if row.read_at else None,
            )
            notifications.append(notification)

        return notifications

    async def mark_as_read(self, notification_id: str) -> Notification:
        QUERY = f"""
        DECLARE $id AS Utf8;
        DECLARE $read_at AS Datetime;

        UPDATE {self.notification_table}
        SET read_at = $read_at
        WHERE id = $id;
        """

        read_at = datetime.now()

        async with self:
            await self.execute(
                QUERY,
                {
                    "$id": notification_id,
                    "$read_at": int(read_at.timestamp()),
                },
                # commit_tx=True,
            )

        notification = await self.get_by_id(notification_id)
        logging.info(f"Notification {notification}")
        return notification

    async def get_by_id(self, notification_id: str) -> Notification:
        QUERY = f"""
        DECLARE $id AS Utf8;
        SELECT * FROM {self.notification_table} WHERE id = $id;
        """

        async with self:
            (result,) = await self.execute(QUERY, {"$id": notification_id})

        if not result.rows:
            return None

        row = result.rows[0]
        notification = Notification(
            id=row.id,
            type=row.type,
            text=row.text,
            sender=row.sender_id,
            receiver_id=row.receiver_id,
            sent_at=datetime.fromtimestamp(row.sent_at),
            read_at=datetime.fromtimestamp(row.read_at) if row.read_at else None,
        )
        return notification

    async def update_read_status(
        self, notification_id: str, read_at: datetime
    ) -> Notification:
        QUERY = f"""
        DECLARE $id AS Utf8;
        DECLARE $read_at AS Datetime?;

        UPDATE {self.notification_table}
        SET read_at = $read_at
        WHERE id = $id;
        """

        async with self:
            await self.execute(
                QUERY,
                {
                    "$id": notification_id,
                    "$read_at": int(read_at.timestamp()) if read_at else None,
                },
                # commit_tx=True,
            )

        notification = await self.get_by_id(notification_id)
        return notification
