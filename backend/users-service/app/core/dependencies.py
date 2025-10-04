"""Dependency injection module providing service instances."""

import os
from typing import Optional

from app.db.base import UoW
from app.services import ServicesFactory
from app.services.notification import NotificationService
from app.services.relation import RelationService
from app.services.user import UserService
from app.use_cases import UseCasesFactory

from .crypto_manager import CryptoManager
from .settings import settings

crypto_manager: Optional[CryptoManager] = None


def get_crypto_manager() -> CryptoManager:
    """Get or create CryptoManager instance.

    Returns:
        CryptoManager instance for cryptographic operations.
    """
    global crypto_manager
    if not crypto_manager:
        crypto_manager = CryptoManager(settings.crypto_settings)
    return crypto_manager


uow: Optional[UoW] = None


def get_uow() -> UoW:
    """Get or create Unit of Work instance.

    Returns:
        Unit of Work instance for database operations.

    Raises:
        ValueError: If unknown store type is configured.
    """
    global uow

    store = os.environ.get("APP_STORE_TYPE", settings.app_store_type)

    UoWClass = __import__(f"app.db.{store}.unit_of_work", fromlist=["app.db"]).UoW

    match store:
        case "ydb":
            uow = UoWClass(**settings.ydb_settings.model_dump())
        case _:
            raise ValueError(f"Unknown store type: {store}")

    return uow


# SERVICES

services = ServicesFactory(get_uow())


def get_services_factory() -> ServicesFactory:
    """Get ServicesFactory instance.

    Returns:
        ServicesFactory for creating service instances.
    """
    return services


def get_user_service() -> UserService:
    """Get UserService instance.

    Returns:
        UserService for user operations.
    """
    return services.get_user_service()


def get_relation_service() -> RelationService:
    """Get RelationService instance.

    Returns:
        RelationService for relation operations.
    """
    return services.get_relation_service()


def get_notification_service() -> NotificationService:
    """Get NotificationService instance.

    Returns:
        NotificationService for notification operations.
    """
    return services.get_notification_service()


# USE CASES

use_cases = UseCasesFactory(get_uow())


def get_use_cases_factory() -> UseCasesFactory:
    """Get UseCasesFactory instance.

    Returns:
        UseCasesFactory for creating use case instances.
    """
    return use_cases
