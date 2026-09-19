"""
app/services/resource_service.py
Recommends and assigns emergency resources (teams, vehicles, equipment,
facilities) based on incident type, severity, and proximity.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

from geopy.distance import geodesic

from app import database as db

logger = logging.getLogger("app.resource_service")

# Maps incident types to the resource types typically required.
_RESOURCE_MAP = {
    "flood": ["rescue_team", "helicopter", "equipment"],
    "fire": ["fire_truck", "rescue_team", "medical_team"],
    "industrial_accident": ["fire_truck", "rescue_team", "medical_team", "equipment"],
    "road_accident": ["ambulance", "police_unit"],
    "medical_emergency": ["ambulance", "medical_team"],
    "structural_collapse": ["rescue_team", "ambulance", "equipment"],
    "other": ["field_team" if False else "rescue_team"],
}

# How many units of each resource type to recommend, scaled by severity.
_SEVERITY_MULTIPLIER = {"critical": 3, "high": 2, "medium": 1, "low": 1}


def recommend_resources(incident: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Returns a ranked list of available resources suitable for the incident,
    nearest first. Never raises to the caller — returns [] on failure so the
    incident is still created and an alert can note the shortage."""
    incident_type = incident.get("incident_type", "other")
    severity = incident.get("severity", "medium")
    needed_types = _RESOURCE_MAP.get(incident_type, ["rescue_team"])
    multiplier = _SEVERITY_MULTIPLIER.get(severity, 1)

    incident_loc = (incident.get("location_lat"), incident.get("location_lng"))
    recommendations: List[Dict[str, Any]] = []

    for r_type in needed_types:
        try:
            available = db.select(
                "resources",
                filters={"resource_type": r_type, "status": "available"},
                limit=100,
            )
        except db.DBError as exc:
            logger.error("Could not fetch resources of type %s: %s", r_type, exc)
            continue
        except Exception:  # noqa: BLE001
            logger.exception("Unexpected error fetching resources of type %s", r_type)
            continue

        if not available:
            logger.warning("No available resources of type %s for incident %s", r_type, incident.get("id"))
            continue

        scored = []
        for res in available:
            res_loc = (res.get("location_lat"), res.get("location_lng"))
            try:
                if None in incident_loc or None in res_loc:
                    distance_km = None
                else:
                    distance_km = round(geodesic(incident_loc, res_loc).km, 2)
            except Exception:  # noqa: BLE001
                distance_km = None
            scored.append({**res, "distance_km": distance_km})

        scored.sort(key=lambda r: (r["distance_km"] is None, r["distance_km"] or 0))
        recommendations.extend(scored[:multiplier])

    return recommendations


def assign_resource(incident_id: str, resource_id: str, eta_minutes: int = None) -> Dict[str, Any]:
    """Creates an assignment record and marks the resource as dispatched.
    Rolls back the resource status change if the assignment insert fails."""
    resource = db.select_one("resources", {"id": resource_id})
    if not resource:
        raise db.DBError(f"Resource {resource_id} not found")
    if resource.get("status") != "available":
        raise db.DBError(f"Resource {resource_id} is not available (status={resource.get('status')})")

    incident = db.select_one("incidents", {"id": incident_id})
    if not incident:
        raise db.DBError(f"Incident {incident_id} not found")

    try:
        db.update("resources", {"id": resource_id}, {"status": "dispatched"})
    except db.DBError:
        logger.exception("Failed to mark resource %s as dispatched", resource_id)
        raise

    try:
        assignment = db.insert("assignments", {
            "incident_id": incident_id,
            "resource_id": resource_id,
            "status": "assigned",
            "eta_minutes": eta_minutes,
            "assigned_at": datetime.now(timezone.utc).isoformat(),
        })
    except db.DBError:
        logger.error("Assignment insert failed, rolling back resource status for %s", resource_id)
        try:
            db.update("resources", {"id": resource_id}, {"status": "available"})
        except db.DBError:
            logger.critical("Rollback FAILED for resource %s — manual fix required", resource_id)
        raise

    try:
        if incident.get("status") in ("reported", "verified"):
            db.update("incidents", {"id": incident_id}, {
                "status": "dispatched",
                "assigned_at": datetime.now(timezone.utc).isoformat(),
            })
    except db.DBError:
        logger.warning("Assignment saved but incident status update failed for %s", incident_id)

    return assignment
