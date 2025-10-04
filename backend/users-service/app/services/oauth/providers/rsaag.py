from ..oauth_provider import OAuthProvider


class RSAAGOAuthProvider(OAuthProvider):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
