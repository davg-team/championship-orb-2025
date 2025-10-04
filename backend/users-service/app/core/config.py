import yaml

from app.services.auth.auth import Auth

# Загрузка конфигурации
with open("config.yaml", "r", encoding="utf-8") as config_file:
    config = yaml.safe_load(config_file)

# with open(config["secret_key_path"], "r") as key_file:
#     SECRET_KEY = key_file.read()

ALGORITHM = config["algorithm"]
ACCESS_TOKEN_EXPIRE_MINUTES = config["access_token_expire_minutes"]
REDIRECT_URI = config["redirect_uri"]

auth = Auth(auth_providers=config["auth_providers"])
