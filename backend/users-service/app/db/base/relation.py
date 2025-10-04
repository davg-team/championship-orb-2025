from abc import ABC, abstractmethod

from app.models.relation import Relation

from .repository import BaseRepository


class RelationRepository(BaseRepository, ABC):
    @abstractmethod
    def insert(self, relation: Relation) -> Relation:
        """Insert relation into database"""
        pass

    @abstractmethod
    def get_by_provider_user_id(self, provider_slug, user_id) -> Relation:
        """Get relation by provider user id"""
        pass
