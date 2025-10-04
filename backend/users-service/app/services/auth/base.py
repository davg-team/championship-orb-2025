from enum import Enum
from typing import Optional

from pydantic import BaseModel


class AuthProviderInfo(BaseModel):
    name: str = "OAuth Provider"
    icon_default: str = "data:image/png;base64,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"
    icon: Optional[str] = None
    description: str = ""


class AuthProviderType(Enum):
    OAUTH2 = "oauth2"
    OTHER = "other"


class AuthProviderStatus(Enum):
    ACTIVE = "active"
    DISABLED = "disabled"
    DEPRECATED = "deprecated"
    INACTIVE = "inactive"


class BaseAuthProvider:
    """Base auth provider"""

    slug: str
    type: AuthProviderType
    service: str
    info: AuthProviderInfo = AuthProviderInfo()
    status: AuthProviderStatus = AuthProviderStatus.DISABLED

    config: dict = {}

    def __init__(self, slug: str, config: dict) -> None:
        self.slug = slug
        self.config = config

        self.type = AuthProviderType(config.get("type"))
        self.service = config.get("service")
        self.status = AuthProviderStatus(
            config.get("status", AuthProviderStatus.DISABLED)
        )
        self.info = AuthProviderInfo(**config.get("info", {}))

        self.setup()

    def __str__(self):
        return f"{self.slug} ({self.type}: {self.service})"

    def __repr__(self):
        return self.__str__().replace(": ", ":").replace(" (", "(")


#   yandex:
#     status: active
#     type: oauth2
#     service: base
#     info:
#       name: ""
#       icon: ""
#       description: ""
#     oauth_params:
#       client:
#         id: "1234567890"
#         secret: "1234567890"
#       urls:
#         authorize: "nnnnnnnnn"
#         issue_token: "nnnnnnnnn"
#         refresh_token: "nnnnnnnnn"
#         revoke_token: "nnnnnnnnn"
#       flow:
#         authorize:
#           response_type: "code"
#         issue_token:
#           grant_type: "authorization_code"
#           data:
#             - "deviceid"
#       scopes:
#         - "login:default_phone"
#       instant_authorization: true
#       pkce:
#         required: true
#         method: "S256"
#     user_info:
#       source: request
#       request:
#         url:
#         method: "GET"
#         auth: "authorization_header"
#         authorization_header: "Bearer {token}"
#       user_id_field:
