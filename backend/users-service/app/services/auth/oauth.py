from typing import Optional, Union
from urllib.parse import urlencode

import jwt
import requests
from pydantic import BaseModel, ConfigDict

from .base import BaseAuthProvider


class OauthClientSettings(BaseModel):
    id: str
    secret: str


class OauthURLsSettings(BaseModel):
    authorize: str
    issue_token: str
    refresh_token: Optional[str] = None
    revoke_token: Optional[str] = None
    introspect_token: Optional[str] = None


class FlowAuthorizeSettings(BaseModel):
    response_type: str = "code"


class FlowIssueTokenSettings(BaseModel):
    grant_type: str = "authorization_code"
    auth: str = "data"
    standard_data: list[str] = ["client_id", "client_secret", "code"]
    data: list[str] = []


class OauthFlowSettings(BaseModel):
    authorize: FlowAuthorizeSettings = FlowAuthorizeSettings()
    issue_token: FlowIssueTokenSettings = FlowIssueTokenSettings()


class OauthOtherSettings(BaseModel):
    instant_authorization: Optional[bool] = False
    pkce: Optional[dict] = {"required": False, "method": None}
    scopes: Optional[list[str]] = []


class UserInfoSettings(BaseModel):
    source: Optional[str] = None
    request: Optional[dict] = {}
    jwt_field: Optional[str] = None
    user_id_field: str


class Authorization:
    def __init__(self, authorization_url: str, flow_settings: FlowAuthorizeSettings):
        self.authorization_url = authorization_url
        self.flow_settings = flow_settings

    @property
    def url(self):
        return self.authorization_url
        return f"{self.authorization_url}?{urlencode(self.params)}"


class TokenResponse(BaseModel):
    access_token: str
    expires_in: int
    refresh_token: str
    token_type: str

    model_config = ConfigDict(
        extra="allow",
    )


class BaseOAuthProvider(BaseAuthProvider):
    """Базовый класс для OAuth провайдеров."""

    oauth_client: OauthClientSettings = None
    oauth_urls: OauthURLsSettings = None
    oauth_flow: OauthFlowSettings = None
    oauth_other_settings: OauthOtherSettings = None
    user_info: UserInfoSettings = None

    def setup(self):
        self.pre_setup()
        self.load_config()

        if not self.info.icon:
            self.info.icon = self.info.icon_default

        self.post_setup()

    def pre_setup(self):
        pass

    def load_config(self):
        self.oauth_params = self.config.get("oauth_params", {})
        self.load_oauth_client()
        self.load_oauth_urls()
        self.load_oauth_flow()
        self.load_oauth_other_settings()
        self.load_user_info()

    def load_oauth_client(self):
        oauth_client = self.oauth_client.model_dump() if self.oauth_client else {}
        oauth_client.update(**self.oauth_params.get("client", {}))
        self.oauth_client = OauthClientSettings(**oauth_client)

    def load_oauth_urls(self):
        oauth_urls = self.oauth_urls.model_dump() if self.oauth_urls else {}
        oauth_urls.update(**self.oauth_params.get("urls", {}))
        self.oauth_urls = OauthURLsSettings(**oauth_urls)

    def load_oauth_flow(self):
        oauth_flow = self.oauth_flow.model_dump() if self.oauth_flow else {}
        oauth_flow.update(**self.oauth_params.get("flow", {}))
        self.oauth_flow = OauthFlowSettings(**oauth_flow)

    def load_oauth_other_settings(self):
        if self.oauth_other_settings:
            instant_authorization = self.oauth_other_settings.instant_authorization
            pkce = self.oauth_other_settings.pkce
            scopes = self.oauth_other_settings.scopes
        else:
            instant_authorization = False
            pkce = {"required": False, "method": None}
            scopes = []

        self.oauth_other_settings = OauthOtherSettings(
            instant_authorization=self.oauth_params.get(
                "instant_authorization", instant_authorization
            ),
            pkce=self.oauth_params.get("pkce", pkce),
            scopes=self.oauth_params.get("scopes", scopes),
        )

    def load_user_info(self):
        user_info = self.user_info.model_dump() if self.user_info else {}
        user_info.update(**self.oauth_params.get("user_info", {}))
        self.user_info = UserInfoSettings(**user_info)

    def post_setup(self):
        pass

    def get_authorization(self) -> Authorization:
        return Authorization(
            authorization_url=self.oauth_urls.authorize,
            flow_settings=self.oauth_flow.authorize,
        )

    def exchange_code_for_token(
        self,
        code: str,
        code_verifier: Optional[str] = None,
        state: str = None,
        deviceid: str = None,
        redirect_uri: str = None,
        **kwargs,
    ) -> Union[TokenResponse, dict]:
        import rich

        rich.print(self.oauth_flow.issue_token)

        flow = self.oauth_flow.issue_token

        data = {
            "grant_type": flow.grant_type,
            "code": code,
        }

        headers = {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.1.359 (beta) Yowser/2.5 Safari/537.36"
        }

        match flow.auth:
            case "data":
                data["client_id"] = self.oauth_client.id
                data["client_secret"] = self.oauth_client.secret
            case "header":
                headers["Authorization"] = (
                    f"Basic {self.oauth_client.id}:{self.oauth_client.secret}"
                )

        if code_verifier:
            data["code_verifier"] = code_verifier

        if redirect_uri:
            data["redirect_uri"] = redirect_uri

        if state:
            data["state"] = state

        if deviceid:
            data["deviceid"] = deviceid

        data.update(kwargs)

        print(data)
        print(self.oauth_urls.issue_token, data, headers)
        response = requests.post(self.oauth_urls.issue_token, data=data, headers=headers)

        print(response)
        print(response.status_code)
        print(response.text)

        if response.status_code == 200:
            print(response.json())
            return TokenResponse(**response.json())
        else:
            print(response.text)
            raise Exception("Error: " + response.text)

    def get_user_id(self, provider_token_data: TokenResponse):
        info_settings = self.user_info

        match info_settings.source:
            case "request":
                user_info = self.get_user_info_request(provider_token_data)
                from rich import print

                print(user_info)
                return self.extract_user_id(user_info)
            case "jwt_id_token":
                jwt_field = info_settings.jwt_field
                jwt_token = provider_token_data.model_dump().get(jwt_field)
                data = jwt.decode(jwt_token, options={"verify_signature": False})
                return self.extract_user_id(data)
            case _:
                raise NotImplementedError("Unknown source")

    def extract_user_id(self, user_info):
        user_id_field = self.user_info.user_id_field

        print(self.user_info)

        for field in user_id_field.split("."):
            try:
                field = int(field)
                user_info = user_info[field]
            except ValueError:
                user_info = user_info.get(field, {})

            print(field, user_info)

        if not user_info:
            raise Exception("User ID not found")

        return user_info

    def get_user_info_request(self, provider_token_data):
        request_settings = self.user_info.request

        if not request_settings:
            raise Exception("Request settings not found")

        url = request_settings.get("url")
        method = request_settings.get("method")
        auth = request_settings.get("auth")

        match auth:
            case "authorization_header":
                headers = {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.1.359 (beta) Yowser/2.5 Safari/537.36",
                    "Authorization": request_settings.get("authorization_header").format(
                        token=provider_token_data.access_token
                    ),
                }

            case _:
                raise NotImplementedError("Unknown auth")

        response = requests.request(method, url, headers=headers)

        if response.status_code == 200:
            return response.json()

        print(response.json())
        raise Exception("Error")


# exemple config
exmpl = """
  yandex:
    status: active
    type: oauth2
    service: base
    info:
      name: ""
      icon: ""
      description: ""
    oauth_params:
      client:
        id: "1234567890"
        secret: "1234567890"
      urls:
        authorize: "nnnnnnnnn"
        issue_token: "nnnnnnnnn"
        refresh_token: "nnnnnnnnn"
        revoke_token: "nnnnnnnnn"
      flow:
        authorize:
          response_type: "code"
        issue_token:
          grant_type: "authorization_code"
          data:
            - "deviceid"
      scopes:
        - "login:default_phone"
      instant_authorization: true
      pkce:
        required: true
        method: "S256"
    user_info:
      source: request
      request:
        url:
        method: "GET"
        auth: "authorization_header"
        authorization_header: "Bearer {token}"
      user_id_field:

"""
