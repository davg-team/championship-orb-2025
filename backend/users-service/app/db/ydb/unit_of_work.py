import logging
from typing import List

import ydb

from ..base import UnitTransaction as AbstractUnitTransaction
from ..base import UoW as AbstractUoW
from ._types import ResultSet
from .notification import NotificationRepository
from .relation import RelationRepository
from .user import UserRepository


class RepositoryEnum:
    user_repo = UserRepository
    relation_repo = RelationRepository
    notification_repo = NotificationRepository


class UnitTransaction(AbstractUnitTransaction):
    repos = RepositoryEnum

    transaction: ydb.aio.table.TxContext = None
    session: ydb.aio.table.Session

    async def acquire(self):
        self.session = await self.uow.session_pool.acquire(
            timeout=self.uow.timeout, retry_num=self.uow.retry_num
        )

    def start_transaction(self):
        self.transaction = self.session.transaction(ydb.SerializableReadWrite())

    async def prepare(self, query):
        return await self.session.prepare(query)

    async def execute(
        self,
        query,
        parameters=None,
        commit_tx=False,
        settings=None,
    ) -> List[ResultSet]:
        logging.info(query)

        if self.transaction is None:
            self.start_transaction()
        query = await self.prepare(query)
        result = await self.transaction.execute(
            query, parameters=parameters, settings=settings, commit_tx=commit_tx
        )

        return result

    async def execute_scheme(self, query, settings=None):
        return await self.session.execute_scheme(query, settings=settings)

    async def commit(self):
        if self.transaction is not None:
            await self.transaction.commit()
            self.transaction = None
            logging.info("### Committed ###")

    async def rollback(self):
        logging.info("### Rolling back ###")
        if self.transaction is not None:
            try:
                await self.transaction.rollback()
            except Exception as e:
                logging.info(e)
            self.transaction = None
            logging.info("### Rolled back ###")
        else:
            logging.info("### Nothing to rollback ###")

    async def release(self):
        await self.session_pool.release(self.session)


class UoW(AbstractUoW):
    setup_done = False
    repos = RepositoryEnum
    unit_module = UnitTransaction

    timeout = 10
    retry_num = 2

    async def setup(self):
        self.credentials = ydb.iam.ServiceAccountCredentials.from_file(
            self.credentials_file
        )

        self.driver_config = ydb.DriverConfig(
            endpoint=self.endpoint,
            database=self.database,
            credentials=self.credentials,
        )

        self.driver = ydb.aio.Driver(driver_config=self.driver_config)
        await self.driver.wait(timeout=10)

        self.session_pool: ydb.aio.SessionPool = ydb.aio.SessionPool(
            self.driver, size=100
        )

        self.setup_done = True
        self.setup_done = True
