from abc import ABC, abstractmethod


class BaseRepository(ABC):
    def __init__(self, unit: "UnitTransaction" = None, uow: "UoW" = None):  # type: ignore  # noqa: F821
        self.unit = unit
        self.uow = uow

    @abstractmethod
    def execute(self, query):
        pass

    async def __aenter__(self):
        if not self.unit:
            self.unit = await self.uow()
            await self.unit.acquire()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            await self.unit.__aexit__(exc_type, exc_val, exc_tb)
            return False
        await self.unit.__aexit__(None, None, None)
        return True
