from app.db.base import UoW

# from app.models.user import User


class RelationService:
    def __init__(self, uow: UoW):
        self.repository = uow.relation_repo

    async def get_relation_by_provider_user_id(self, provider_slug, user_id):
        print(provider_slug, user_id)
        return await self.repository.get_by_provider_user_id(provider_slug, user_id)
