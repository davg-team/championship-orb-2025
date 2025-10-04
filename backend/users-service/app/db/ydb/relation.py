import logging
from datetime import datetime

from app.models.relation import Relation

from ..base import RelationRepository as BaseRelationRepository
from .repository import BaseRepository


class RelationRepository(BaseRepository, BaseRelationRepository):
    relations_table = "auth_provider_relations"

    CREATE_RELATION_TABLE = f"""
        CREATE TABLE {relations_table}
        (
            provider_slug Utf8,
            provider_service Utf8,
            provider_user_id Utf8,
            user_id Utf8,
            linked_at Datetime,
            used_at Datetime,
            PRIMARY KEY (provider_slug, provider_user_id)
        )
        WITH (
            AUTO_PARTITIONING_BY_SIZE = ENABLED,
            AUTO_PARTITIONING_BY_LOAD = ENABLED,
            AUTO_PARTITIONING_PARTITION_SIZE_MB = 2048,
            AUTO_PARTITIONING_MIN_PARTITIONS_COUNT = 1,
            KEY_BLOOM_FILTER = DISABLED
        );
    """

    async def insert(self, relation: Relation) -> Relation:
        QUERY = f"""
        DECLARE $provider_slug AS Utf8;
        DECLARE $provider_service AS Utf8;
        DECLARE $provider_user_id AS Utf8;
        DECLARE $user_id AS Utf8;
        DECLARE $linked_at AS Datetime;
        DECLARE $used_at AS Datetime;
        INSERT INTO {self.relations_table}
        (provider_slug, provider_service, provider_user_id, user_id, linked_at, used_at)
        VALUES
        ($provider_slug, $provider_service, $provider_user_id, $user_id, $linked_at, $used_at);
        """

        if not relation.linked_at:
            relation.linked_at = datetime.now()

        logging.info(relation.__dict__)

        async with self:
            await self.execute(
                QUERY,
                {
                    "$provider_slug": relation.provider_slug,
                    "$provider_service": relation.provider_service or "",
                    "$provider_user_id": relation.provider_user_id,
                    "$user_id": relation.user_id,
                    "$linked_at": int(relation.linked_at.timestamp()),
                    "$used_at": int(relation.used_at.timestamp())
                    if relation.used_at
                    else int(relation.linked_at.timestamp()),
                },
                # commit_tx=True,
            )

        return relation

    async def get_by_provider_user_id(self, provider_slug, provider_user_id) -> Relation:
        QUERY = f"""
        DECLARE $provider_slug AS Utf8;
        DECLARE $provider_user_id AS Utf8;
        SELECT * FROM {self.relations_table}
        WHERE provider_slug = $provider_slug AND provider_user_id = $provider_user_id;
        """

        async with self:
            (r,) = await self.execute(
                QUERY,
                {
                    "$provider_slug": provider_slug,
                    "$provider_user_id": provider_user_id,
                },
            )

        if not r or not r.rows:
            return None

        row = r.rows[0]

        relation = Relation()

        relation.provider_slug = row.provider_slug
        relation.provider_service = row.provider_service
        relation.provider_user_id = row.provider_user_id
        relation.user_id = row.user_id
        relation.linked_at = datetime.fromtimestamp(row.linked_at)
        relation.used_at = datetime.fromtimestamp(row.used_at) if row.used_at else None

        return relation
