from ..oauth import (
    BaseOAuthProvider,
    FlowAuthorizeSettings,
    FlowIssueTokenSettings,
    OauthFlowSettings,
    OauthOtherSettings,
    OauthURLsSettings,
    UserInfoSettings,
)


class YandexOAuthProvider(BaseOAuthProvider):
    """Yandex OAuth провайдер."""

    icon = "https://upload.wikimedia.org/wikipedia/commons/5/58/Yandex_icon.svg"
    name = "Яндекс"
    description = "Yandex OAuth провайдер"

    oauth_urls = OauthURLsSettings(
        authorize="https://oauth.yandex.ru/authorize",
        issue_token="https://oauth.yandex.ru/token",
        refresh_token="https://oauth.yandex.ru/token",
        revoke_token="https://oauth.yandex.ru/revoke_token",
    )
    oauth_flow = OauthFlowSettings(
        authorize=FlowAuthorizeSettings(response_type="code"),
        issue_token=FlowIssueTokenSettings(grant_type="authorization_code"),
    )

    oauth_other_settings = OauthOtherSettings(
        scopes=["login:default_phone", "login:email", "login:info", "login:avatar"],
        instant_authorization=False,
        pkce={"required": False, "method": "S256"},
    )

    user_info = UserInfoSettings(
        source="request",
        request={
            "url": "https://login.yandex.ru/info",
            "method": "GET",
            "auth": "authorization_header",
            "authorization_header": "OAuth {token}",
        },
        user_id_field="id",
    )

    def pre_setup(self):
        if not self.info.icon:
            self.info.icon = self.icon
