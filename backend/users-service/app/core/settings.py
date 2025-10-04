import enum
from pathlib import Path
from tempfile import gettempdir
from typing import Optional

import yaml
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

TEMP_DIR = Path(gettempdir())


class LogLevel(str, enum.Enum):
    """Possible log levels."""

    NOTSET = "NOTSET"
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    FATAL = "FATAL"


class YDBSettings(BaseModel):
    """YDB settings."""

    endpoint: str = None
    database: str = None
    credentials_file: str = None


class Settings(BaseSettings):
    """
    Application settings.

    These parameters can be configured
    with environment variables.
    """

    host: str = "127.0.0.1"
    port: int = 8003
    # quantity of workers for uvicorn
    workers_count: int = 1
    # Enable uvicorn reloading
    reload: bool = True
    # reload: bool = False

    # Current environment
    environment: str = "dev"

    log_level: LogLevel = LogLevel.INFO

    # Store

    app_store_type: str = "ydb"  # store type: ydb, postgres

    ydb_settings: YDBSettings = YDBSettings()

    # This variable is used to define
    # multiproc_dir. It's required for [uvi|guni]corn projects.
    prometheus_dir: Path = TEMP_DIR / "prom"

    # Sentry's configuration.
    sentry_dsn: Optional[str] = None
    sentry_sample_rate: float = 1.0

    # Grpc endpoint for opentelemetry.
    # E.G. http://localhost:4317
    opentelemetry_endpoint: Optional[str] = None

    config_path: str = "config.yaml"
    config_: dict = {}

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="AUTH_APP_",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
    )

    @property
    def crypto_settings(self):
        return self.config.get("crypto", {})

    @property
    def config(self):
        # Загрузка конфигурации
        if not self.config_:
            self.load_config()
        return self.config_

    def load_config(self):
        path = self.config_path
        with open(path, "r", encoding="utf-8") as config_file:
            config = yaml.safe_load(config_file)
        self.config_ = config


settings = Settings()
