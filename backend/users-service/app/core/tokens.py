from datetime import datetime, timedelta
from typing import Union

from app.models import Role, Status, User


def user_to_token_claims(user: User):
    """Converts user object to token"""
    return {
        "sub": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "second_name": user.second_name,
        "email": user.email,
        "phone": user.phone,
        "avatar": user.avatar,
        "region_id": user.region_id,
        "tg_id": user.tg_id,
        "snils": user.snils,
        "role": user.role.value,
        "status": user.status.value,
        "required": user.required,
        "notification_ways": user.notification_ways,
        "created_at": user.created_at.timestamp(),
        "last_login_at": user.last_login_at.timestamp(),
        "other_data": user.other_data,
        "exp": int((datetime.utcnow() + timedelta(minutes=60 * 12)).timestamp()),
        "iss": "platform",
        "aud": "platform",
        "iat": int(datetime.utcnow().timestamp()),
    }


def token_claims_to_user(claims: dict) -> Union[User, None]:
    """Converts token to user object"""
    return User(
        id=claims["sub"],
        first_name=claims["first_name"],
        last_name=claims["last_name"],
        second_name=claims["second_name"],
        email=claims["email"],
        phone=claims["phone"],
        avatar=claims["avatar"],
        region_id=claims["region_id"],
        tg_id=claims["tg_id"],
        snils=claims["snils"],
        role=Role(claims["role"]),
        status=Status(claims["status"]),
        required=claims["required"],
        notification_ways=claims["notification_ways"],
        created_at=datetime.fromtimestamp(claims["created_at"]),
        last_login_at=datetime.fromtimestamp(claims["last_login_at"]),
        other_data=claims["other_data"],
    )
