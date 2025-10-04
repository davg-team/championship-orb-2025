from abc import ABC, abstractmethod

from .repository import BaseRepository

from app.models.user import User


class UserRepository(BaseRepository, ABC):
    @abstractmethod
    async def insert(self, user: User) -> User:
        """Insert user into database"""
        pass

    @abstractmethod
    async def get_by_id(self, user_id) -> User:
        """Get user by id"""
        pass
