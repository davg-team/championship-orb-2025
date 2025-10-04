import yaml

from .oauth_provider import OAuthProvider
from .providers import RSAAGOAuthProvider, VKOAuthProvider, YandexOAuthProvider


def load_config(config_file):
    with open(config_file, "r") as f:
        return yaml.safe_load(f)


def create_provider(config):
    provider_type = config.get("provider_type")
    if provider_type == "yandex":
        return YandexOAuthProvider(**config)
    elif provider_type == "vkid":
        return VKOAuthProvider(**config)
    elif provider_type == "rsaag_orb":
        return RSAAGOAuthProvider(**config)
    else:
        return OAuthProvider(**config)
