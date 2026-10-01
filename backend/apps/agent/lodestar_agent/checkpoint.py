"""Checkpointer selection: Postgres (schema ``agent``) when DATABASE_URL is set, else in-memory."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import psycopg
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import Settings

log = logging.getLogger("lodestar_agent.checkpoint")

SCHEMA_RE = re.compile(r"^[a-z_][a-z0-9_]{0,62}$")


@dataclass
class Checkpointing:
    saver: BaseCheckpointSaver
    kind: str
    pool: Any = None

    def ready(self) -> bool:
        if self.pool is None:
            return True
        try:
            with self.pool.connection(timeout=2) as conn:
                conn.execute("SELECT 1")
            return True
        except Exception:  # noqa: BLE001 - readiness must never raise
            log.warning("checkpoint database not reachable")
            return False

    def close(self) -> None:
        if self.pool is not None:
            self.pool.close()


def normalise_conninfo(url: str) -> str:
    """Accept Prisma/SQLAlchemy style URLs: drop ``?schema=`` and ``+driver`` suffixes."""
    parts = urlsplit(url)
    scheme = parts.scheme.split("+", 1)[0]
    if scheme == "postgres":
        scheme = "postgresql"
    query = urlencode([(k, v) for k, v in parse_qsl(parts.query) if k != "schema"])
    return urlunsplit((scheme, parts.netloc, parts.path, query, parts.fragment))


def create_checkpointing(settings: Settings) -> Checkpointing:
    if settings.database_url is None or not settings.database_url.get_secret_value():
        log.info("checkpointer: in-memory (DATABASE_URL not set)")
        return Checkpointing(MemorySaver(), "memory")
    schema = settings.checkpoint_schema
    if not SCHEMA_RE.match(schema):
        raise ValueError(f"invalid checkpoint schema name '{schema}'")
    conninfo = normalise_conninfo(settings.database_url.get_secret_value())
    with psycopg.connect(conninfo, autocommit=True) as conn:
        conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema}"')
    pool = ConnectionPool(
        conninfo,
        min_size=1,
        max_size=10,
        open=True,
        kwargs={"autocommit": True, "prepare_threshold": 0, "row_factory": dict_row, "options": f"-c search_path={schema}"},
    )
    saver = PostgresSaver(pool)
    saver.setup()
    log.info("checkpointer: postgres", extra={"schema": schema})
    return Checkpointing(saver, "postgres", pool)
