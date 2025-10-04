import json
import threading
from typing import Dict, List, Optional

import yaml
from jwcrypto import jwe, jwk, jwt


class CryptoManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(CryptoManager, cls).__new__(cls)
        return cls._instance

    def __init__(self, config: Optional[Dict] = None):
        if not hasattr(self, "initialized"):
            self.jwt_keys_ = {"all": [], "default": None}
            self.encryption_keys_ = {"all": [], "default": None}
            if config:
                self.setup(config)
            self.initialized = True

    def load_key(self, key_info: Dict) -> list[jwk.JWK, List[str]]:
        path = key_info.get("pem")
        password = key_info.get("password")

        if path:
            with open(path, "rb") as key_file:
                password_ = key_info.get("pem_password")
                print(password_)
                key = jwk.JWK.from_pem(
                    key_file.read(),
                    password=bytes(password_, "utf-8") if password_ else None,
                )
        elif password:
            key = jwk.JWK.from_password(password)

        data = {
            k: v
            for k, v in key_info.items()
            if k not in ["pem", "password", "pem_password", "assignment"]
        }

        key.update(data)

        return key, key_info.get("assignment", [])

    def load_keys_section(self, section_name_: str, config: Dict):
        section_name = section_name_ + "_keys_"
        for key_info in config.get("keys", []):
            key, assignments = self.load_key(key_info)

            if "NOT_USE" in assignments:
                continue
            if "default" in assignments:
                self.__dict__[section_name]["default"] = key
            self.__dict__[section_name]["all"] = (
                [key]
                if "all" not in self.encryption_keys
                else self.__dict__[section_name]["all"] + [key]
            )
            for assignment in assignments:
                if assignment != "all" and assignment != "default":
                    self.__dict__[section_name][assignment] = (
                        [key]
                        if assignment not in self.__dict__[section_name]
                        else self.__dict__[section_name][assignment] + [key]
                    )

    def setup(self, config: Dict):
        self.config = config

        self.setup_jwt()
        self.setup_encryption()

    def setup_jwt(self):
        jwt_config = self.config.get("jwt", {})

        self.load_keys_section("jwt", jwt_config)

    def setup_encryption(self):
        encryption_config = self.config.get("encryption", {})

        self.load_keys_section("encryption", encryption_config)

    @property
    def jwt_keys(self) -> jwk.JWKSet:
        """Все jwt ключи"""

        jwks = jwk.JWKSet()
        for key in self.jwt_keys_["all"]:
            jwks.add(key)
        return jwks

    @property
    def encryption_keys(self) -> jwk.JWKSet:
        """Все ключи для шифрования сообщений"""

        jwks = jwk.JWKSet()
        for key in self.encryption_keys_["all"]:
            jwks.add(key)
        return jwks

    def create_signed_jwt(
        self,
        payload: dict,
        kid: str = None,
    ) -> str:
        # Получение ключа по его идентификатору (kid)
        if not kid:
            signing_key = self.jwt_keys_["default"]
        else:
            signing_key = self.jwt_keys.get_key(kid)

        kid = signing_key.kid

        # Создание JWT токена
        token = jwt.JWT(header={"alg": signing_key.alg, "kid": kid}, claims=payload)

        # Подпись токена
        # token.make_signed_token(signing_key)
        token.make_signed_token(signing_key)

        return token.serialize()

    def verify_jwt_token(self, token: str) -> dict:
        # Десериализация JWT токена

        jws_token = jwt.JWS.from_jose_token(token)

        # Получение ключа по его идентификатору (kid)
        key = self.jwt_keys.get_key(jws_token.jose_header["kid"])

        jwt_token = jwt.JWT(jwt=token, key=key)

        return json.loads(jwt_token.claims)

    def encrypt_message(self, message: str, kid: str = None) -> str:
        # Получение ключа по его идентификатору (kid)
        if not kid:
            encryption_key = self.encryption_keys_["default"]
        else:
            encryption_key = self.encryption_keys.get_key(kid)

        kid = encryption_key.thumbprint()

        # Создание JWE с шифрованием
        jwe_token = jwe.JWE(
            plaintext=message.encode("utf-8"),
            protected={"alg": encryption_key.alg, "enc": "A256GCM", "kid": kid},
        )

        jwe_token.add_recipient(encryption_key)

        return jwe_token.serialize()

    def decrypt_message(self, encrypted_message: str) -> str:
        # Десериализация JWE токена
        jwe_token = jwe.JWE()
        jwe_token.deserialize(encrypted_message)

        # Получение ключа по его идентификатору (kid)
        key = self.encryption_keys.get_key(jwe_token.jose_header["kid"])

        # Дешифровка сообщения
        jwe_token.decrypt(key)

        return jwe_token.payload.decode("utf-8")

    def generate_symmetric_key(self, alg="A256GCM") -> jwk.JWK:
        key = jwk.JWK.generate(kty="oct", size=256)
        key.use = "enc"
        key.alg = alg
        return key

    def export_jwk(self, key: jwk.JWK) -> dict:
        return key.export(as_dict=True)

    def export_public_jwks(self) -> dict:
        return self.jwt_keys.export(as_dict=True, private_keys=False)


# keys:
#   jwt:
#     - pem: "common/keys/private_key.pem"
#       alg: "RS256"
#       use: "sig"
#       assignment:
#         - "default"
#     - pem: "common/keys/private_key2.pem"
#       pem_password: "test_password"
#       alg: "RS256"
#       use: "sig"
#       assignment:
#         - "NOT_USE"
#   msg:
#     - pem: "common/keys/private_key.pem"
#       alg: "RS256"
#       use: "sig"
#       assignment:
#         - "msg_test"
#     - password: "test_password"
#       use: "sig"
#       assignment:
#         - "msg_test2"

# Пример использования:
with open("config.yaml", "r", encoding="utf_8", errors="ignore") as config_file:
    config = yaml.safe_load(config_file)


# Инициализация синглтона с конфигурацией
# crypto_manager = CryptoManager(config["crypto"])

# from rich import print

# print(crypto_manager.jwt_keys.export(as_dict=True))

# # Создание JWT
# payload = {"sub": "1234567890", "name": "John Doe", "admin": True}
# jwt_token = jwt_crypto_manager.create_signed_jwt(payload, kid="your_kid_here")

# # Верификация JWT
# claims = jwt_crypto_manager.verify_jwt_token(jwt_token)

# Шифрование сообщения
# encrypted_message = crypto_manager.encrypt_message("Secret Message")

# print(encrypted_message)

# # Дешифровка сообщения
# decrypted_message = jwt_crypto_manager.decrypt_message(encrypted_message)
