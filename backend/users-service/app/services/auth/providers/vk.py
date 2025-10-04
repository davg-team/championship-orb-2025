from ..oauth import (
    BaseOAuthProvider,
    FlowAuthorizeSettings,
    FlowIssueTokenSettings,
    OauthFlowSettings,
    OauthOtherSettings,
    OauthURLsSettings,
    UserInfoSettings,
)


class VKOAuthProvider(BaseOAuthProvider):
    """VK OAuth провайдер."""

    icon = "https://vk.com/images/icons/favicons/fav_logo.ico"
    name = "VK"
    description = "VK OAuth провайдер"

    oauth_urls = OauthURLsSettings(
        authorize="https://oauth.vk.com/authorize",
        issue_token="https://oauth.vk.com/access_token",
        refresh_token="https://oauth.vk.com/access_token",
        revoke_token="https://oauth.vk.com/revoke_token",
    )
    oauth_flow = OauthFlowSettings(
        authorize=FlowAuthorizeSettings(response_type="code"),
        issue_token=FlowIssueTokenSettings(grant_type="authorization_code"),
    )

    oauth_other_settings = OauthOtherSettings(
        scopes=["email", "offline"],
        instant_authorization=False,
        pkce={"required": False, "method": "S256"},
    )

    user_info = UserInfoSettings(
        source="request",
        request={
            "url": "https://api.vk.com/method/users.get",
            "method": "GET",
            "auth": "authorization_header",
            "authorization_header": "Bearer {token}",
        },
        user_id_field="id",
    )

    def pre_setup(self):
        if not self.info.icon:
            self.info.icon = self.icon
