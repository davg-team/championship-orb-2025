import logging
from typing import List

from ..base import BaseRepository as AbstractRepository
from ._types import ResultSet


class BaseRepository(AbstractRepository):
    async def execute(
        self, query, parameters=None, commit_tx=False, settings=None, execute_scheme=False
    ) -> List[ResultSet]:
        logging.info("BaseRepository.execute")
        logging.info(f"parameters: {parameters}")
        return await self.unit.execute(
            query,
            parameters=parameters,
            commit_tx=commit_tx,
            settings=settings,
        )

    async def execute_scheme(self, query, settings=None):
        return await self.unit.execute_scheme(query, settings=settings)
