from ..oauth import BaseOAuthProvider, OauthProvider, OauthFlow, UserInfoSettings


class GoogleOAuthProvider(BaseOAuthProvider):
    """Google OAuth провайдер.
    https://developers.google.com/identity/protocols/oauth2
    """

    oauth_provider = OauthProvider(
        authorize="https://accounts.google.com/o/oauth2/auth",
        issue_token="https://oauth2.googleapis.com/token",
        refresh_token=None,
        revoke_token=None,
        introspect_token=None,
    )
    oauth_flow = OauthFlow(
        response_type="code",
        grant_type="authorization_code",
        redirect_uri="https://your-service.com/oauth/callback/google",
        pkce={"required": True, "method": "S256"},
        token_request={
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
        },
    )
    user_info = UserInfoSettings(
        url="https://www.googleapis.com/oauth2/v3/userinfo",
        user_id_field="sub",
        user_info_request={
            "method": "GET",
            "auth": "authorization_header",
            "authorization_header": "Bearer {token}",
        },
    )
