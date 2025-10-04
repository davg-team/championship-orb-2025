from ..oauth import (
    BaseOAuthProvider,
    FlowAuthorizeSettings,
    FlowIssueTokenSettings,
    OauthFlowSettings,
    OauthOtherSettings,
    OauthURLsSettings,
    UserInfoSettings,
)


class TalentOAuthProvider(BaseOAuthProvider):
    """Talent OAuth провайдер."""

    icon = "https://talent.kruzhok.org/images/talent_symbol.svg"
    name = "Талант"
    description = "Платформа Талант"

    oauth_urls = OauthURLsSettings(
        authorize="https://talent.kruzhok.org/oauth/authorize/",
        issue_token="https://talent.kruzhok.org/api/oauth/issue-token/",
    )

    oauth_flow = OauthFlowSettings(
        authorize=FlowAuthorizeSettings(response_type="code"),
        issue_token=FlowIssueTokenSettings(grant_type="authorization_code"),
    )

    oauth_other_settings = OauthOtherSettings(
        scopes=["openid"],
        instant_authorization=False,
        pkce={"required": False, "method": "S256"},
    )

    user_info = UserInfoSettings(
        source="jwt_id_token",
        jwt_field="access_token",
        user_id_field="sub",
    )

    def pre_setup(self):
        if not self.info.icon:
            self.info.icon = self.icon


#   talent:
#     status: active
#     type: oauth2
#     service: base
#     info:
#       name: "Талант"
#       icon: "https://talent.kruzhok.org/images/talent_symbol.svg"
#       description: "Талант платформа"
#     oauth_params:
#       client:
#         id: "KoMaKUH1nzS00HbxAbwV77tGMGodP16MBExgOBlO79hjqou6"
#         secret: "taSAsTarTyRx1e49ttqargIx6aHuKgAIp01wm3jjk6numa2J"
#       urls:
#         authorize: "https://talent.kruzhok.org/oauth/authorize/"
#         issue_token: "https://talent.kruzhok.org/api/oauth/issue-token/"
#       scopes:
#         - "openid"
#       instant_authorization: false
#       user_info:
#         source: request
#         request:
#           url: "https://talent.kruzhok.org/api/users/me/"
#           method: "GET"
#           auth: "authorization_header"
#           authorization_header: "Bearer {token}"
#         user_id_field: "id"
