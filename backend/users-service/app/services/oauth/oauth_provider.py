import base64
import hashlib
import os
from typing import Optional
from urllib.parse import urlencode

import requests

from .exceptions import TokenExchangeError


class OAuthProvider:
    def __init__(
        self,
        client_id: str,
        client_secret: str,
        scope: str,
        redirect_uri: str,
        authorize_url: str,
        access_token_url: str,
        user_info_url: Optional[str] = None,
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.scope = scope
        self.redirect_uri = redirect_uri
        self.authorize_url = authorize_url
        self.access_token_url = access_token_url
        self.user_info_url = user_info_url
        self.code_verifier = None
        self.code_challenge = None

    def generate_code_verifier(self):
        self.code_verifier = (
            base64.urlsafe_b64encode(os.urandom(40)).rstrip(b"=").decode("utf-8")
        )
        self.code_challenge = (
            base64.urlsafe_b64encode(
                hashlib.sha256(self.code_verifier.encode("utf-8")).digest()
            )
            .rstrip(b"=")
            .decode("utf-8")
        )
        return self.code_verifier, self.code_challenge

    def get_authorization_url(self, state=None):
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": self.scope,
        }
        if state:
            params["state"] = state
        if self.code_challenge:
            params["code_challenge"] = self.code_challenge
            params["code_challenge_method"] = "S256"
        return f"{self.authorize_url}?{urlencode(params)}"

    def exchange_code_for_token(self, code):
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.redirect_uri,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        if self.code_verifier:
            data["code_verifier"] = self.code_verifier
        response = requests.post(self.access_token_url, data=data)
        if response.status_code != 200:
            raise TokenExchangeError("Failed to exchange code for token")
        return response.json()

    def get_user_info(self, access_token):
        if not self.user_info_url:
            raise NotImplementedError("User info URL is not provided for this provider")
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(self.user_info_url, headers=headers)
        return response.json()
