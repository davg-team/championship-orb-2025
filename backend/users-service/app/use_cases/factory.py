from datetime import datetime

from app.db.base.unit_of_work import UoW
from app.models.relation import Relation
from app.models.user import Role, Status, User


class UseCasesFactory:
    def __init__(self, uow: UoW):
        self.uow = uow

    async def create_user_from_provider(
        self, provider_slug, provider_user_id, provider_data
    ):
        """Создаёт нового пользователя и добавляет связь с провайдером
        Правила:
        1.
        """

        async with await self.uow() as u:
            user = User()
            user.id = User.generate_uuid()
            user.role = Role.user
            user.status = Status.active
            user.created_at = datetime.now()
            user.last_login_at = datetime.now()
            user.other_data = {}
            user.required.append("registration")

            if user.email:
                user.notification_ways.append("email")

            user = await u.user_repo.insert(user)

            relation = Relation()

            relation.id = Relation.generate_uuid()
            relation.provider_slug = provider_slug
            relation.provider_user_id = provider_user_id
            relation.provider_service = provider_data.get("provider_service")
            relation.user_id = user.id
            relation.linked_at = datetime.now()
            relation.used_at = datetime.now()

            await u.relation_repo.insert(relation)

        return user
