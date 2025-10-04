from ..oauth import BaseOAuthProvider, OauthProvider, OauthFlow, UserInfoSettings


class GitHubOAuthProvider(BaseOAuthProvider):
    """GitHub OAuth провайдер.
    https://docs.github.com/ru/developers/apps/building-oauth-apps
    https://github.com/settings/applications/
    """

    oauth_provider = OauthProvider(
        authorize="https://github.com/login/oauth/authorize",
        issue_token="https://github.com/login/oauth/access_token",
        refresh_token=None,
        revoke_token=None,
        introspect_token=None,
    )
    oauth_flow = OauthFlow(
        response_type="code",
        grant_type="authorization_code",
        redirect_uri="https://your-service.com/oauth/callback/github",
        pkce={"required": False, "method": "S256"},
        token_request={
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
        },
    )
    user_info = UserInfoSettings(
        url="https://api.github.com/user",
        user_id_field="id",
        user_info_request={
            "method": "GET",
            "auth": "authorization_header",
            "authorization_header": "token {token}",
        },
    )
