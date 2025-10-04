class OAuthError(Exception):
    """Base class for OAuth exceptions"""

    pass


class InvalidProviderError(OAuthError):
    """Exception for invalid provider type"""

    pass


class TokenExchangeError(OAuthError):
    """Exception for token exchange failures"""

    pass
