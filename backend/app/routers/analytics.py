"""
app/routers/analytics.py
Analytics on emergency types, response delays, resource shortages, and
frequently affected areas (hotspots).
"""
import logging
from collections import Counter, defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app import database as db

logger = logging.getLogger("app.routers.analytics")
router = APIRouter(prefix="/analytics", tags=["Analytics"])


def _parse_ts(value):
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:  # noqa: BLE001
        return None


@router.get("/incident-types")
def incident_types_breakdown():
    try:
        incidents = db.select("incidents", filters={}, limit=1000)
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return dict(Counter(i.get("incident_type", "unknown") for i in incidents))


@router.get("/response-delays")
def response_delay_analytics():
    try:
        incidents = db.select("incidents", filters={}, limit=1000)
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    delays = []
    breached = 0
    for inc in incidents:
        reported = _parse_ts(inc.get("reported_at"))
        responded = _parse_ts(inc.get("assigned_at")) or _parse_ts(inc.get("verified_at"))
        if reported and responded:
            delay_minutes = (responded - reported).total_seconds() / 60
            delays.append(delay_minutes)
            sla = _parse_ts(inc.get("sla_deadline"))
            if sla and responded > sla:
                breached += 1

    avg_delay = round(sum(delays) / len(delays), 1) if delays else None
    return {
        "average_response_delay_minutes": avg_delay,
        "sla_breaches": breached,
        "sample_size": len(delays),
    }


@router.get("/resource-shortages")
def resource_shortage_analytics():
    try:
        resources = db.select("resources", filters={}, limit=1000)
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    by_type = defaultdict(lambda: {"available": 0, "dispatched": 0, "maintenance": 0, "unavailable": 0})
    for r in resources:
        r_type = r.get("resource_type", "unknown")
        status = r.get("status", "unavailable")
        if status not in by_type[r_type]:
            by_type[r_type][status] = 0
        by_type[r_type][status] += 1

    shortages = {
        r_type: counts for r_type, counts in by_type.items()
        if counts.get("available", 0) == 0
    }
    return {"by_type": dict(by_type), "types_with_zero_availability": shortages}


@router.get("/hotspots")
def hotspot_analytics(precision: int = 2):
    """Buckets incidents into a coarse lat/lng grid to find frequently
    affected areas without needing full reverse-geocoding."""
    try:
        incidents = db.select("incidents", filters={}, limit=1000)
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    buckets = Counter()
    for inc in incidents:
        lat, lng = inc.get("location_lat"), inc.get("location_lng")
        if lat is None or lng is None:
            continue
        key = (round(lat, precision), round(lng, precision))
        buckets[key] += 1

    top = buckets.most_common(15)
    return [{"lat": k[0], "lng": k[1], "incident_count": v} for k, v in top]
