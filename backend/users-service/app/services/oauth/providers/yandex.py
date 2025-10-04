from ..oauth_provider import OAuthProvider


class YandexOAuthProvider(OAuthProvider):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
