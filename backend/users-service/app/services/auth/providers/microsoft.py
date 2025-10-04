from ..oauth import BaseOAuthProvider, OauthProvider, OauthFlow, UserInfoSettings


class MicrosoftOAuthProvider(BaseOAuthProvider):
    """Microsoft OAuth провайдер.
    https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
    """

    oauth_provider = OauthProvider(
        authorize="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        issue_token="https://login.microsoftonline.com/common/oauth2/v2.0/token",
        refresh_token=None,
        revoke_token=None,
        introspect_token=None,
    )
    oauth_flow = OauthFlow(
        response_type="code",
        grant_type="authorization_code",
        redirect_uri="https://your-service.com/oauth/callback/microsoft",
        pkce={"required": True, "method": "S256"},
        token_request={
            "method": "POST",
            "headers": {"Content-Type": "application/x-www-form-urlencoded"},
        },
    )
    user_info = UserInfoSettings(
        url="https://graph.microsoft.com/oidc/userinfo",
        user_id_field="sub",
        user_info_request={
            "method": "GET",
            "auth": "authorization_header",
            "authorization_header": "Bearer {token}",
        },
    )
