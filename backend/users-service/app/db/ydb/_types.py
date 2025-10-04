"""Additions to types of the standard `ydb` module."""

from typing import Any, List

from ydb import convert


class Row(convert._Row):
    """Support get by index, slice, and column name"""


class ResultSet:
    columns: Any
    rows: List[Row]
    truncated: Any
    snapshot: Any
