"""
app/services/duplicate_service.py
Detects duplicate/related incident reports using geo-distance + text
similarity + time proximity, with an optional LLM similarity boost.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from geopy.distance import geodesic
from rapidfuzz import fuzz

from app.config import get_settings
from app import database as db
from app.services import llm_service

logger = logging.getLogger("app.duplicate_service")
settings = get_settings()


def _parse_ts(value: str) -> datetime:
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:  # noqa: BLE001
        return datetime.now(timezone.utc)


def find_duplicate(new_incident: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Scans recent open incidents of the same type for a likely duplicate.
    Returns the matching master incident dict, or None."""
    try:
        window_start = (
            datetime.now(timezone.utc) - timedelta(minutes=settings.DUPLICATE_TIME_WINDOW_MINUTES)
        ).isoformat()

        candidates = db.select(
            "incidents",
            filters={"incident_type": new_incident.get("incident_type")},
            limit=200,
            order_by="reported_at",
        )
    except db.DBError as exc:
        logger.error("Duplicate lookup failed, skipping dedup check: %s", exc)
        return None
    except Exception:  # noqa: BLE001
        logger.exception("Unexpected error during duplicate lookup")
        return None

    if not candidates:
        return None

    new_loc = (new_incident.get("location_lat"), new_incident.get("location_lng"))
    new_text = new_incident.get("description", "")

    best_match = None
    best_score = 0.0

    for cand in candidates:
        try:
            if cand.get("status") in ("resolved", "closed", "duplicate"):
                continue
            if cand.get("id") == new_incident.get("id"):
                continue

            reported_at = cand.get("reported_at")
            if reported_at and _parse_ts(reported_at) < _parse_ts(window_start):
                continue

            cand_loc = (cand.get("location_lat"), cand.get("location_lng"))
            if None in cand_loc or None in new_loc:
                distance_km = 9999
            else:
                distance_km = geodesic(new_loc, cand_loc).km

            if distance_km > settings.DUPLICATE_DISTANCE_KM:
                continue

            text_score = fuzz.token_set_ratio(new_text, cand.get("description", ""))

            if text_score < settings.DUPLICATE_TEXT_SIMILARITY_THRESHOLD:
                continue

            distance_score = max(0, 1 - (distance_km / max(settings.DUPLICATE_DISTANCE_KM, 0.01))) * 100
            combined_score = 0.6 * text_score + 0.4 * distance_score

            if combined_score > best_score:
                best_score = combined_score
                best_match = cand
        except Exception:  # noqa: BLE001
            logger.exception("Error scoring duplicate candidate %s", cand.get("id"))
            continue

    if best_match and best_score >= settings.DUPLICATE_TEXT_SIMILARITY_THRESHOLD:
        logger.info(
            "Duplicate detected: new report matches incident %s (score=%.1f)",
            best_match.get("id"), best_score,
        )
        return best_match

    return None


def merge_into_master(master_id: str, new_incident_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Increments the report_count on the master incident and logs the
    consolidated report. Returns the updated master incident."""
    try:
        master = db.select_one("incidents", {"id": master_id})
        if not master:
            raise db.DBError(f"Master incident {master_id} not found")

        updated = db.update(
            "incidents",
            {"id": master_id},
            {
                "report_count": (master.get("report_count") or 1) + 1,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        try:
            db.insert("incident_reports_log", {
                "incident_id": master_id,
                "source": new_incident_payload.get("source"),
                "description": new_incident_payload.get("description"),
                "raw_payload": new_incident_payload.get("raw_payload"),
            })
        except db.DBError:
            logger.warning("Could not log consolidated report for %s (non-fatal)", master_id)

        return updated[0] if updated else master
    except db.DBError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to merge incident into master %s", master_id)
        raise db.DBError(str(exc)) from exc