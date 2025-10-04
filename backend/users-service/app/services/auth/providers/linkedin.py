from ..oauth import BaseOAuthProvider, OauthProvider, OauthFlow, UserInfoSettings


class LinkedinOAuthProvider(BaseOAuthProvider):
    """LinkedIn OAuth провайдер.
    https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
    """

    oauth_provider = OauthProvider(
        authorize="https://www.linkedin.com/oauth/v2/authorization",
        issue_token="https://www.linkedin.com/oauth/v2/accessToken",
        refresh_token=None,
        revoke_token=None,
    )
    oauth_flow = OauthFlow(
        response_type="code",
        grant_type="authorization_code",
        pkce={"required": False, "method": "S256"},
        token_request={
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
        },
    )

    user_info = UserInfoSettings(
        url="https://api.linkedin.com/v2/me",
        user_id_field="id",
        user_info_request={
            "method": "GET",
            "auth": "authorization_header",
            "authorization_header": "Bearer {token}",
        },
    )
