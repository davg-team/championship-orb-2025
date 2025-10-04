"""This file contains the tools for the API. (e.g. decorators)"""


from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from fastapi_decorators import depends

from app.core.crypto_manager import CryptoManager
from app.core.dependencies import get_crypto_manager
from app.core.tokens import token_claims_to_user

bearer = HTTPBearer(description="Bearer token")


def authorize(*required_role: str):
    """Decorator for checking the authorization of the user. And setting the user in the request state."""

    def dependency(
        request: Request,
        token: str = Depends(bearer),
        crypto_manager: CryptoManager = Depends(get_crypto_manager),
    ):
        print("token", token)
        print("required_scopes", required_role)

        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Отсутствует токен"
            )

        try:
            jwt_claims = crypto_manager.verify_jwt_token(token.credentials)
            print("jwt_claims", jwt_claims)
            if required_role:
                if required_role != jwt_claims.get("role"):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Недостаточно прав",
                    )

            # Устанавливаем пользователя в состояние запроса
            request.state.jwt = jwt_claims
            request.state.user = token_claims_to_user(jwt_claims)

        except Exception as e:
            print("e", e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Неверный токен. {e}"
            )

    return depends(Depends(dependency))
