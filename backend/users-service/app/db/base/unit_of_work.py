from abc import ABC, abstractmethod
from typing import Any

from .relation import RelationRepository
from .user import UserRepository


class RepositoryEnumTypes:
    user_repo: UserRepository
    parent_repo: RelationRepository


class RepositoryEnum:
    user_repo = UserRepository
    relation_repo = RelationRepository


class UnitTransaction(ABC, RepositoryEnumTypes):
    repos = RepositoryEnum

    def __init__(self, *args, uow: "UoW" = None, **kwargs):
        self.uow = uow
        self.committed = False

    @abstractmethod
    async def acquire(self):
        pass

    @abstractmethod
    async def execute(self, sql):
        pass

    @abstractmethod
    async def commit(self):
        pass

    @abstractmethod
    async def rollback(self):
        pass

    @abstractmethod
    async def release(self):
        pass

    def __getattr__(self, name: str) -> Any:
        if name.endswith("_repo"):
            return getattr(self.repos, name)(unit=self)
        else:
            return self.__dict__[name]

    async def __aenter__(self):
        print("Starting transaction")
        await self.acquire()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            await self.commit()
        else:
            await self.rollback()


class UoW(RepositoryEnumTypes):
    setup_done = True
    repos = RepositoryEnum
    unit_module = UnitTransaction
    last_transaction = None

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def __getattr__(self, name: str) -> Any:
        if name.endswith("_repo"):
            return getattr(self.repos, name)(uow=self)
        else:
            return self.__dict__[name]

    async def __call__(self, *args: Any, **kwargs: Any) -> UnitTransaction:
        if not self.setup_done:
            await self.setup()
        self.last_transaction = self.unit_module(*args, uow=self, **kwargs)
        return self.last_transaction

    async def setup(self):
        self.setup_done = True
        print("Setting up UoW")

    async def commit(self):
        if self.last_transaction:
            await self.last_transaction.commit()
