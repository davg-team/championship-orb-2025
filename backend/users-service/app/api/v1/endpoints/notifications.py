# api/v1/endpoints/notifications.py

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from app.api.tools import authorize
from app.core.dependencies import get_crypto_manager, get_notification_service
from app.services.notification import NotificationService

api_router = APIRouter()

bearer = HTTPBearer(description="Bearer token")
crypto_manager = get_crypto_manager()


@api_router.post("/notifications/send", response_model=dict)
async def send_notification(
    notification_data: dict,
    bearer=Depends(bearer),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Отправка уведомления пользователю"""
    try:
        # token = crypto_manager.verify_jwt_token(bearer.credentials)
        # sender_id = token["sub"]
        # notification_data["sender_id"] = sender_id
        sent_notification = await notification_service.send_notification(
            notification_data
        )
        return sent_notification.dict()
    except Exception as e:
        logging.error(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось отправить уведомление",
        )


@api_router.get("/notifications", response_model=List[dict])
@authorize()
async def get_notifications(
    request: Request,
    notification_service: NotificationService = Depends(get_notification_service),
    # jwt из request.state.jwt
):
    """Получение уведомлений пользователя"""
    try:
        jwt = request.state.jwt
        receiver_id = jwt["sub"]
        notifications = await notification_service.get_notifications(receiver_id)
        print("receiver_id", receiver_id)
        print("notifications", notifications)
        return [notification.dict() for notification in notifications]
    except Exception as e:
        logging.error(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось получить уведомления",
        )


class NotifUpdateModel(BaseModel):
    is_read: bool


@api_router.put("/notifications/{notification_id}", response_model=dict)
async def mark_notification_as_read(
    notification_id: str,
    data: NotifUpdateModel,
    bearer=Depends(bearer),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Отметка уведомления прочитанным"""
    try:
        token = crypto_manager.verify_jwt_token(bearer.credentials)
        receiver_id = token["sub"]
        print("Token reciver", receiver_id)
        notification = await notification_service.get_notification_by_id(notification_id)
        print("Notification reciver", notification.receiver_id)
        if not (notification.receiver_id == receiver_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Нет прав на действие",
            )
        updated_notification = await notification_service.update_read_status(
            notification_id, data.is_read
        )
        return updated_notification.dict()
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось отметить уведомление как прочитанное",
        )
