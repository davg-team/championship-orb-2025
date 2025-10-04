import base64
import hashlib
import hmac
import json
import time
from typing import Optional


from ..base import BaseAuthProvider


class TelegramDataIsOutdatedError(Exception):
    pass


class NotTelegramDataError(Exception):
    pass


def add_padding(base64_str):
    return base64_str + "=" * (-len(base64_str) % 4)


class TelegramAuthProvider(BaseAuthProvider):
    """Провайдер авторизации для Telegram."""

    ONE_DAY_IN_SECONDS = 86400

    def setup(self):
        self.bot_token = self.config["telegram_params"]["bot"]["token"]
        self.bot_username = self.config["telegram_params"]["bot"]["username"]
        self.bot_id = self.config["telegram_params"]["bot"]["id"]
        self.request_access = (
            self.config["telegram_params"]["request_access"]
            if "request_access" in self.config["telegram_params"]
            else None
        )

    def verify_telegram_authentication(self, request_data):
        """
        Check if received data from Telegram is real.

        Based on SHA and HMAC algorithms.
        Instructions - https://core.telegram.org/widgets/login#checking-authorization
        """
        request_data = request_data.copy()

        received_hash = request_data["hash"]
        auth_date = request_data["auth_date"]

        request_data.pop("hash", None)
        request_data_alphabetical_order = sorted(request_data.items(), key=lambda x: x[0])

        data_check_string = []

        for data_pair in request_data_alphabetical_order:
            key, value = data_pair[0], data_pair[1]
            data_check_string.append(f"{key}={value}")

        data_check_string = "\n".join(data_check_string)

        secret_key = hashlib.sha256(self.bot_token.encode()).digest()
        _hash = hmac.new(
            secret_key, msg=data_check_string.encode(), digestmod=hashlib.sha256
        ).hexdigest()

        unix_time_now = int(time.time())
        unix_time_auth_date = int(auth_date)

        if unix_time_now - unix_time_auth_date > self.ONE_DAY_IN_SECONDS:
            raise TelegramDataIsOutdatedError(
                "Authentication data is outdated. Authentication was received more than a day ago."
            )

        if _hash != received_hash:
            raise NotTelegramDataError(
                "This is not Telegram data. Hash from received authentication data does not match"
                " with calculated hash based on bot token."
            )

        return request_data

    def verify_tg_auth_result(self, tgAuthResult: str) -> dict:
        """
        Check if received data from Telegram is real.

        Based on SHA and HMAC algorithms.
        Instructions - https://core.telegram.org/widgets/login
        """

        # tgAuthResult=eyJpZCI6NDkzNDMxNTM2LCJmaXJzdF9uYW1lIjoiXHUwNDE0XHUwNDNjXHUwNDM4XHUwNDQyXHUwNDQwXHUwNDM4XHUwNDM5IiwibGFzdF9uYW1lIjoiKERldkRLKSIsInVzZXJuYW1lIjoiRGV2ZWxvcGVyREsiLCJwaG90b191cmwiOiJodHRwczpcL1wvdC5tZVwvaVwvdXNlcnBpY1wvMzIwXC9PVG1SREdVbGJTV1B2bl9ubFhLTTV5S2VaVFp5NUg2cGtwcm5lOVdhekNRLmpwZyIsImF1dGhfZGF0ZSI6MTcyNDg2MjE5OCwiaGFzaCI6ImJhMzJlMzcwMWQ1YTgzODAzMmYxYWY2YzMwYzAxZTVhZGU5NWFhNGNkN2JiYjhmZWMyMjIxMjZiMTNhZTI2NWUifQ

        # Декодируем base64
        tgAuthResult = base64.b64decode(add_padding(tgAuthResult), validate=False).decode(
            "utf-8"
        )

        return self.verify_telegram_authentication(json.loads(tgAuthResult))

    def get_user_id(self, data: dict) -> Optional[str]:
        return data.get("id")
