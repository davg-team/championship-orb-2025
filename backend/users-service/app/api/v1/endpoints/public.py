
from fastapi import Depends, APIRouter

from app.core.crypto_manager import CryptoManager
from app.core.dependencies import get_crypto_manager


api_router = APIRouter()


# API-метод для получения JWKS
@api_router.get("/.well-known/jwks.json")
async def get_jwks(crypto_manager: CryptoManager = Depends(get_crypto_manager)):
    jwks = crypto_manager.export_public_jwks()

    return jwks
