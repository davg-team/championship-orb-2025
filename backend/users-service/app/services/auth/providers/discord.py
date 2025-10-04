from ..oauth import BaseOAuthProvider, OauthProvider, OauthFlow, UserInfoSettings


class DiscordOAuthProvider(BaseOAuthProvider):
    """Discord OAuth провайдер.
    https://discord.com/developers/docs/topics/oauth2
    """

    oauth_provider = OauthProvider(
        authorize="https://discord.com/api/oauth2/authorize",
        issue_token="https://discord.com/api/oauth2/token",
        refresh_token=None,
        revoke_token=None,
        introspect_token=None,
    )
    oauth_flow = OauthFlow(
        response_type="code",
        grant_type="authorization_code",
        redirect_uri="https://your-service.com/oauth/callback/discord",
        pkce={"required": True, "method": "S256"},
        token_request={
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
        },
    )
    user_info = UserInfoSettings(
        url="https://discord.com/api/v10/users/@me",
        user_id_field="id",
        user_info_request={
            "method": "GET",
            "auth": "authorization_header",
            "authorization_header": "Bearer {token}",
        },
    )
