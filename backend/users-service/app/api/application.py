from fastapi import FastAPI
from fastapi.responses import UJSONResponse

from app.api.lifetime import register_shutdown_event, register_startup_event
from app.api.v1.router import api_router
from app.core.log import configure_logging


def get_app() -> FastAPI:
    """
    Get FastAPI application.

    This is the main constructor of an application.

    :return: application.
    """
    configure_logging()

    app_metadata = {
        "title": "Authorization Service",
        "summary": "API for user authentication and authorization.",
        "description": "A comprehensive API for managing user authentication and authorization, including OAuth2, JWT, and SSO support.",
        "version": "1.0.0",  # Замените на актуальную версию вашего приложения
        "terms_of_service": "https://www.example.com/terms/",
        "contact": {
            "name": "API Support Team",
            "url": "http://www.example.com/support",
            "email": "support@example.com",  # Замените на актуальный контактный email
        },
        "license": {
            "name": "All Rights Reserved",
            "identifier": "ARR",
            "url": "https://www.example.com/license",  # Замените на актуальную ссылку на условия лицензии или на страницу с контактной информацией
        },
    }

    tags_metadata = [
        {
            "name": "observability",
            "description": "Observability endpoints for the API.",
        },
        {
            "name": "providers",
            "description": "Endpoints for managing authentication providers.",
        },
    ]

    app = FastAPI(
        **app_metadata,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        default_response_class=UJSONResponse,
        openapi_tags=tags_metadata,
    )

    # Adds startup and shutdown events.
    register_startup_event(app)
    register_shutdown_event(app)

    # Main router for the API.
    app.include_router(router=api_router, prefix="/api", include_in_schema=False)
    app.include_router(router=api_router, prefix="/api/auth")

    return app


global app
app = get_app()
