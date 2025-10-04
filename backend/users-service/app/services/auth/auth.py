from typing import Dict, Optional, Type

from .base import BaseAuthProvider
from .oauth import BaseOAuthProvider
from .providers import TalentOAuthProvider, TelegramAuthProvider, YandexOAuthProvider
from .utils.singleton import Singleton


class Auth(metaclass=Singleton):
    """Сервис авторизации."""

    known_auth_providers: Dict[str, Dict[str, Type[BaseAuthProvider]]] = {
        "oauth2": {
            "yandex": YandexOAuthProvider,
            "talent": TalentOAuthProvider,
        },
        "other": {
            "telegram": TelegramAuthProvider,
        },
    }

    def __init__(self, auth_providers: Dict[str, dict]) -> None:
        self.auth_providers_config = auth_providers
        self.auth_providers: Dict[str, BaseAuthProvider] = {}
        self.setup()

    def setup(self):
        for slug, config in self.auth_providers_config.items():
            type = config.get("type")
            service = config.get("service")

            provider_class = self.known_auth_providers.get(type, {}).get(service)

            if provider_class:
                self.auth_providers[slug] = provider_class(slug, config)

            elif service == "base" and type == "oauth2":
                self.auth_providers[slug] = BaseOAuthProvider(slug, config)

            else:
                print(f"Unknown auth provider: {service} ({type}) - {slug}")

    def __getitem__(self, slug: str) -> Optional[BaseAuthProvider]:
        return self.auth_providers.get(slug)

    def list_providers(self):
        return list(self.auth_providers.values())
