"""YDB User Repository implementation."""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Optional

from app.models.user import Role, Status, User

from ..base import UserRepository as BaseUserRepository
from .repository import BaseRepository


class UserRepository(BaseRepository, BaseUserRepository):
    """YDB implementation of UserRepository."""

    users_table = "users"

    CREATE_USERS_TABLE = f"""
        CREATE TABLE {users_table}
        (
            user_id Utf8,
            first_name Utf8,
            last_name Utf8,
            second_name Utf8,
            email Utf8,
            phone Utf8,
            avatar Utf8,
            region_id Utf8,
            tg_id Utf8,
            snils Utf8,
            role Utf8,
            status Utf8,
            required Json,
            notification_ways Json,
            created_at Datetime,
            last_login_at Datetime,
            other_data Json,
            PRIMARY KEY (user_id)
        )
        WITH (
            AUTO_PARTITIONING_BY_SIZE = ENABLED,
            AUTO_PARTITIONING_BY_LOAD = ENABLED,
            AUTO_PARTITIONING_PARTITION_SIZE_MB = 2048,
            AUTO_PARTITIONING_MIN_PARTITIONS_COUNT = 1,
            KEY_BLOOM_FILTER = DISABLED
        );
    """

    async def insert(self, user: User) -> User:
        """Insert a new user into the database.

        Args:
            user: User instance to insert.

        Returns:
            The inserted user with generated ID and timestamps.
        """
        QUERY = f"""
        DECLARE $user_id AS Utf8;
        DECLARE $first_name AS Utf8?;
        DECLARE $last_name AS Utf8?;
        DECLARE $second_name AS Utf8?;
        DECLARE $email AS Utf8?;
        DECLARE $phone AS Utf8?;
        DECLARE $avatar AS Utf8?;
        DECLARE $region_id AS Utf8?;
        DECLARE $tg_id AS Utf8?;
        DECLARE $snils AS Utf8?;
        DECLARE $role AS Utf8?;
        DECLARE $status AS Utf8?;
        DECLARE $required AS Json?;
        DECLARE $notification_ways AS Json?;
        DECLARE $created_at AS Datetime?;
        DECLARE $last_login_at AS Datetime?;
        DECLARE $other_data AS Json?;

        UPSERT INTO {self.users_table}
        (
            user_id,
            first_name,
            last_name,
            second_name,
            email,
            phone,
            avatar,
            region_id,
            tg_id,
            snils,
            role,
            status,
            required,
            notification_ways,
            created_at,
            last_login_at,
            other_data
        )
        VALUES
        (
            $user_id,
            $first_name,
            $last_name,
            $second_name,
            $email,
            $phone,
            $avatar,
            $region_id,
            $tg_id,
            $snils,
            $role,
            $status,
            $required,
            $notification_ways,
            $created_at,
            $last_login_at,
            $other_data
        );
        """

        if not user.id:
            user.id = user.generate_uuid()

        if not user.created_at:
            user.created_at = datetime.now()

        async with self:
            await self.execute(
                QUERY,
                {
                    "$user_id": user.id,
                    "$first_name": user.first_name,
                    "$last_name": user.last_name,
                    "$second_name": user.second_name,
                    "$email": user.email,
                    "$phone": user.phone,
                    "$avatar": user.avatar,
                    "$region_id": user.region_id,
                    "$tg_id": str(user.tg_id),
                    "$snils": user.snils,
                    "$role": user.role.value,
                    "$status": user.status.value if user.status else None,
                    "$required": json.dumps(user.required),
                    "$notification_ways": json.dumps(user.notification_ways),
                    "$created_at": int(user.created_at.timestamp()),
                    "$last_login_at": int(user.last_login_at.timestamp())
                    if user.last_login_at
                    else None,
                    "$other_data": json.dumps(user.other_data),
                },
            )

        logging.info(
            {
                "$user_id": user.id,
                "$first_name": user.first_name,
                "$last_name": user.last_name,
                "$second_name": user.second_name,
                "$email": user.email,
                "$phone": user.phone,
                "$avatar": user.avatar,
                "$region_id": user.region_id,
                "$tg_id": str(user.tg_id),
                "$snils": user.snils,
                "$role": user.role.value,
                "$status": user.status.value if user.status else None,
                "$required": json.dumps(user.required),
                "$notification_ways": json.dumps(user.notification_ways),
                "$created_at": int(user.created_at.timestamp()),
                "$last_login_at": int(user.last_login_at.timestamp())
                if user.last_login_at
                else None,
                "$other_data": json.dumps(user.other_data),
            }
        )

        return user

    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID.

        Args:
            user_id: Unique identifier of the user.

        Returns:
            User instance if found, None otherwise.
        """
        QUERY = f"""
        DECLARE $user_id AS Utf8;
        SELECT * FROM {self.users_table}
        WHERE user_id = $user_id;
        """
        async with self:
            (r,) = await self.execute(QUERY, {"$user_id": user_id})

        row = r.rows[0]
        user = User()

        user.id = row.user_id
        user.first_name = row.first_name
        user.last_name = row.last_name
        user.second_name = row.second_name
        user.email = row.email
        user.phone = row.phone
        user.avatar = row.avatar
        user.region_id = row.region_id
        user.tg_id = row.tg_id
        user.snils = row.snils
        user.role = Role(row.role) if row.role else Role.user
        user.status = Status(row.status) if row.status else None
        user.required = json.loads(row.required) if row.required else []
        user.notification_ways = (
            json.loads(row.notification_ways) if row.notification_ways else []
        )
        user.created_at = datetime.fromtimestamp(row.created_at)
        user.last_login_at = (
            datetime.fromtimestamp(row.last_login_at) if row.last_login_at else None
        )
        user.other_data = json.loads(row.other_data)

        return user

    async def update(self, user: User) -> User:
        QUERY = f"""
        DECLARE $user_id AS Utf8;
        DECLARE $first_name AS Utf8?;
        DECLARE $last_name AS Utf8?;
        DECLARE $second_name AS Utf8?;
        DECLARE $email AS Utf8?;
        DECLARE $phone AS Utf8?;
        DECLARE $avatar AS Utf8?;
        DECLARE $region_id AS Utf8?;
        DECLARE $tg_id AS Utf8?;
        DECLARE $snils AS Utf8?;
        DECLARE $role AS Utf8?;
        DECLARE $status AS Utf8?;
        DECLARE $required AS Json?;
        DECLARE $notification_ways AS Json?;
        DECLARE $created_at AS Datetime?;
        DECLARE $last_login_at AS Datetime?;
        DECLARE $other_data AS Json?;

        UPDATE {self.users_table}
        SET
            first_name = $first_name,
            last_name = $last_name,
            second_name = $second_name,
            email = $email,
            phone = $phone,
            avatar = $avatar,
            region_id = $region_id,
            tg_id = $tg_id,
            snils = $snils,
            role = $role,
            status = $status,
            required = $required,
            notification_ways = $notification_ways,
            created_at = $created_at,
            last_login_at = $last_login_at,
            other_data = $other_data
        WHERE user_id = $user_id;
        """

        async with self:
            await self.execute(
                QUERY,
                {
                    "$user_id": user.id,
                    "$first_name": user.first_name,
                    "$last_name": user.last_name,
                    "$second_name": user.second_name,
                    "$email": user.email,
                    "$phone": user.phone,
                    "$avatar": user.avatar,
                    "$region_id": user.region_id,
                    "$tg_id": str(user.tg_id),
                    "$snils": user.snils,
                    "$role": user.role.value,
                    "$status": user.status.value if user.status else None,
                    "$required": json.dumps(user.required),
                    "$notification_ways": json.dumps(user.notification_ways),
                    "$created_at": int(user.created_at.timestamp()),
                    "$last_login_at": int(user.last_login_at.timestamp())
                    if user.last_login_at
                    else None,
                    "$other_data": json.dumps(user.other_data),
                },
            )

        return user

    async def get_user_notification_settings(
        self, user_id: str
    ) -> Optional[dict[str, Any]]:
        QUERY = """
        DECLARE $user_id AS Utf8;
        SELECT notification_ways, tg_id, email FROM users WHERE user_id = $user_id;
        """

        async with self:
            (r,) = await self.execute(QUERY, {"$user_id": user_id})

        row = r.rows[0]

        settings = {
            "notification_ways": json.loads(row.notification_ways),
        }

        if "tg" in settings["notification_ways"]:
            settings["tg_id"] = row.tg_id

        if "email" in settings["notification_ways"]:
            settings["email"] = row.email

        return settings

    async def get_users_notification_settings(
        self, region_id: str, role: str
    ) -> list[dict[str, Any]]:
        QUERY = """
        DECLARE $role AS Utf8;
        SELECT user_id, notification_ways, tg_id, email FROM users
        WHERE role = $role;
        """
        # (callable проверяет чтоб хотя бы одна роль из roles была в списке user_roles)

        async with self:
            (r,) = await self.execute(QUERY, {"$role": role})

        settings = []

        for row in r.rows:
            user_settings = {
                "user_id": row.user_id,
                "notification_ways": row.notification_ways,
            }

            if "tg" in user_settings["notification_ways"]:
                user_settings["tg_id"] = row.tg_id

            if "email" in user_settings["notification_ways"]:
                user_settings["email"] = row.email

            settings.append(user_settings)

        return settings

    async def get_users_by_ids(self, ids: list[str]) -> list[User]:
        if not ids:
            return []

        QUERY = f"""
        DECLARE $user_ids AS List<Utf8>;
        SELECT * FROM {self.users_table}
        WHERE user_id IN $user_ids;
        """

        async with self:
            (r,) = await self.execute(QUERY, {"$user_ids": ids})

        users = []
        for row in r.rows:
            user = User()
            user.id = row.user_id
            user.first_name = row.first_name
            user.last_name = row.last_name
            user.second_name = row.second_name
            user.email = row.email
            # user.phone = row.phone
            user.avatar = row.avatar
            user.region_id = row.region_id
            # user.tg_id = row.tg_id
            # user.snils = row.snils
            user.role = Role(row.role) if row.role else Role.user
            # user.status = Status(row.status) if row.status else None
            # user.required = json.loads(row.required) if row.required else []
            # user.notification_ways = (
            #     json.loads(row.notification_ways) if row.notification_ways else []
            # )
            # user.created_at = datetime.fromtimestamp(row.created_at)
            # user.last_login_at = (
            #     datetime.fromtimestamp(row.last_login_at) if row.last_login_at else None
            # )
            # user.other_data = json.loads(row.other_data) if row.other_data else {}
            users.append(user)

        return users

    async def get_users_by_filters(
        self,
        date_filter: Optional[str] = None,
        created_after: Optional[datetime] = None,
        region_id: Optional[str] = None,
        role: Optional[str] = None,
        status_: Optional[str] = None,
    ) -> list[User]:
        where_clauses = []
        query_params = {}
        query = ""

        if date_filter == "last_30":
            where_clauses.append("created_at >= $date_limit")
            query_params["$date_limit"] = int(
                (datetime.now() - timedelta(days=30)).timestamp()
            )
            query += "DECLARE $date_limit AS Datetime?;\n"

        if created_after:
            where_clauses.append("created_at >= $created_after")
            query_params["$created_after"] = int(created_after.timestamp())
            query += "DECLARE $created_after AS Datetime?;\n"

        if region_id:
            where_clauses.append("region_id = $region_id")
            query_params["$region_id"] = region_id
            query += "DECLARE $region_id AS Utf8?;\n"

        if role:
            where_clauses.append(
                "COALESCE(CAST(roles AS String), '') LIKE '%'||COALESCE($role, '')||'%'"
            )
            query_params["$role"] = role
            query += "DECLARE $role AS Utf8?;\n"

        if status_:
            where_clauses.append("status = $status")
            query_params["$status"] = status_
            query += "DECLARE $status AS Utf8?;\n"

        where_clause_str = ""
        if where_clauses:
            where_clause_str = "WHERE " + " AND ".join(where_clauses)

        query += f"""
            SELECT user_id, region_id, role, status, created_at
            FROM {self.users_table}
            {where_clause_str};
        """

        async with self:
            (r,) = await self.execute(query, query_params)

        users = []
        for row in r.rows:
            users.append(
                {
                    "user_id": row.user_id,
                    "region_id": row.region_id,
                    "role": row.role,
                    "status": row.status,
                    "created_at": datetime.fromtimestamp(row.created_at)
                    if row.created_at
                    else None,
                }
            )
        return users
