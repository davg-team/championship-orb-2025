from ..oauth_provider import OAuthProvider


class VKOAuthProvider(OAuthProvider):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def get_authorization_url(self, state=None):
        url = super().get_authorization_url(state)
        if "types" in self.__dict__ and "one_tap" in self.types:
            url += "&display=page"
        return url
