"""
app/database.py
Supabase client wrapper with defensive error handling. All DB access in the
app goes through this module so failures are logged and surfaced consistently.
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import HTTPException
from supabase import create_client, Client

from app.config import get_settings

logger = logging.getLogger("app.database")

settings = get_settings()

_client: Optional[Client] = None


def get_client() -> Client:
    """Lazily create and cache the Supabase client. Raises a clean 503 if
    Supabase cannot be reached instead of letting a raw exception bubble up."""
    global _client
    if _client is None:
        try:
            _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to initialize Supabase client")
            raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}") from exc
    return _client


def check_connection() -> bool:
    """Used on startup / health check to verify Supabase is reachable."""
    try:
        client = get_client()
        client.table("incidents").select("id").limit(1).execute()
        return True
    except Exception:  # noqa: BLE001
        logger.exception("Supabase connection check failed")
        return False


class DBError(Exception):
    """Raised when a Supabase operation fails, wraps the underlying cause."""


def _run(op_name: str, fn):
    try:
        result = fn()
        return result.data if hasattr(result, "data") else result
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Supabase operation '%s' failed", op_name)
        raise DBError(f"{op_name} failed: {exc}") from exc


def insert(table: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    client = get_client()
    data = _run(f"insert:{table}", lambda: client.table(table).insert(payload).execute())
    if not data:
        raise DBError(f"insert into {table} returned no data")
    return data[0]


def select(
    table: str,
    filters: Optional[Dict[str, Any]] = None,
    columns: str = "*",
    limit: Optional[int] = None,
    order_by: Optional[str] = None,
    ascending: bool = False,
) -> List[Dict[str, Any]]:
    client = get_client()

    def op():
        q = client.table(table).select(columns)
        if filters:
            for key, value in filters.items():
                if isinstance(value, (list, tuple)):
                    q = q.in_(key, list(value))
                else:
                    q = q.eq(key, value)
        if order_by:
            q = q.order(order_by, desc=not ascending)
        if limit:
            q = q.limit(limit)
        return q.execute()

    return _run(f"select:{table}", op)


def select_one(table: str, filters: Dict[str, Any], columns: str = "*") -> Optional[Dict[str, Any]]:
    rows = select(table, filters=filters, columns=columns, limit=1)
    return rows[0] if rows else None


def update(table: str, filters: Dict[str, Any], payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    client = get_client()

    def op():
        q = client.table(table).update(payload)
        for key, value in filters.items():
            q = q.eq(key, value)
        return q.execute()

    return _run(f"update:{table}", op)


def delete(table: str, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    client = get_client()

    def op():
        q = client.table(table).delete()
        for key, value in filters.items():
            q = q.eq(key, value)
        return q.execute()

    return _run(f"delete:{table}", op)