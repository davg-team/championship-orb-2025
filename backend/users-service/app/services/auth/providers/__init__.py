# from .discord import DiscordOAuthProvider
# from .dropbox import DropboxOAuthProvider
# from .github import GitHubOAuthProvider
# from .google import GoogleOAuthProvider
# from .instagram import InstagramOAuthProvider
# from .linkedin import LinkedinOAuthProvider
# from .microsoft import MicrosoftOAuthProvider
# from .reddit import RedditOAuthProvider
# from .spotify import SpotifyOAuthProvider
# from .telegram import TelegramAuthProvider
# from .twitch import TwitchOAuthProvider
# from .twitter import TwitterOAuthProvider
from .talent import TalentOAuthProvider
from .telegram import TelegramAuthProvider
from .yandex import YandexOAuthProvider

__all__ = [
    #     "DiscordOAuthProvider",
    #     "DropboxOAuthProvider",
    #     "GitHubOAuthProvider",
    #     "GoogleOAuthProvider",
    #     "InstagramOAuthProvider",
    #     "LinkedinOAuthProvider",
    #     "MicrosoftOAuthProvider",
    #     "RedditOAuthProvider",
    #     "SpotifyOAuthProvider",
    "TelegramAuthProvider",
    #     "TwitchOAuthProvider",
    #     "TwitterOAuthProvider",
    "YandexOAuthProvider",
    "TalentOAuthProvider",
]
