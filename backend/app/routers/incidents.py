"""
app/routers/incidents.py
Incident collection, AI classification, duplicate consolidation, and
resource-recommendation triggers.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app import database as db
from app.schemas import IncidentCreate, IncidentUpdate, IncidentOut
from app.services import llm_service, duplicate_service, resource_service, email_service
from app.websocket_manager import manager
from app.config import get_settings

logger = logging.getLogger("app.routers.incidents")
router = APIRouter(prefix="/incidents", tags=["Incidents"])
settings = get_settings()


@router.post("", response_model=IncidentOut, status_code=201)
async def create_incident(payload: IncidentCreate):
    """Ingests an incident report from any source (citizen, sensor, call,
    field team, hospital, government), classifies it via AI, checks for
    duplicates, consolidates if needed, and triggers resource recommendation."""
    try:
        classification = llm_service.classify_incident(
            description=payload.description,
            source=payload.source.value,
            address=payload.location.address,
        )
    except Exception:  # noqa: BLE001
        logger.exception("Classification pipeline crashed unexpectedly")
        classification = {
            "incident_type": payload.incident_type.value if payload.incident_type else "other",
            "severity": "medium",
            "priority": "P3",
            "confidence": 0.0,
            "reasoning": "Classification failed; default values applied.",
        }

    incident_type = payload.incident_type.value if payload.incident_type else classification.get("incident_type", "other")
    severity = classification.get("severity", "medium")

    candidate = {
        "id": str(uuid.uuid4()),
        "incident_type": incident_type,
        "description": payload.description,
        "location_lat": payload.location.lat,
        "location_lng": payload.location.lng,
    }

    try:
        duplicate_master = duplicate_service.find_duplicate(candidate)
    except Exception:  # noqa: BLE001
        logger.exception("Duplicate detection crashed; proceeding without dedup")
        duplicate_master = None

    if duplicate_master:
        try:
            updated_master = duplicate_service.merge_into_master(duplicate_master["id"], {
                "source": payload.source.value,
                "description": payload.description,
                "raw_payload": payload.raw_payload,
            })
            await manager.broadcast("incident_consolidated", updated_master)
            return _to_incident_out(updated_master)
        except db.DBError as exc:
            logger.error("Failed to merge duplicate, creating as new incident instead: %s", exc)

    sla_minutes = settings.sla_minutes_for(severity)
    now = datetime.now(timezone.utc)
    sla_deadline = now.isoformat()
    try:
        from datetime import timedelta
        sla_deadline = (now + timedelta(minutes=sla_minutes)).isoformat()
    except Exception:  # noqa: BLE001
        pass

    record = {
        "source": payload.source.value,
        "incident_type": incident_type,
        "description": payload.description,
        "location_lat": payload.location.lat,
        "location_lng": payload.location.lng,
        "address": payload.location.address,
        "severity": severity,
        "priority": classification.get("priority", "P3"),
        "status": "reported",
        "confidence": classification.get("confidence", 0.5),
        "report_count": 1,
        "reported_at": now.isoformat(),
        "sla_deadline": sla_deadline,
        "updated_at": now.isoformat(),
    }

    try:
        incident = db.insert("incidents", record)
    except db.DBError as exc:
        logger.exception("Failed to create incident")
        raise HTTPException(status_code=500, detail=f"Could not save incident: {exc}") from exc

    try:
        incident["ai_summary"] = llm_service.generate_incident_summary(incident)
        incident["ai_recommendations"] = llm_service.generate_recommendations(incident)
        db.update("incidents", {"id": incident["id"]}, {
            "ai_summary": incident["ai_summary"],
            "ai_recommendations": incident["ai_recommendations"],
        })
    except Exception:  # noqa: BLE001
        logger.exception("AI summary/recommendation generation failed (non-fatal)")

    try:
        recommended = resource_service.recommend_resources(incident)
        if not recommended:
            email_service.notify_resource_shortage(incident, incident_type)
    except Exception:  # noqa: BLE001
        logger.exception("Resource recommendation failed (non-fatal)")
        recommended = []

    try:
        await manager.broadcast("incident_created", {**incident, "recommended_resources": recommended})
    except Exception:  # noqa: BLE001
        logger.exception("WebSocket broadcast failed (non-fatal)")

    if severity == "critical":
        try:
            email_service.notify_critical_incident(incident)
        except Exception:  # noqa: BLE001
            logger.exception("Critical incident email failed (non-fatal)")

    return _to_incident_out(incident)


@router.get("", response_model=list)
def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    incident_type: Optional[str] = None,
    limit: int = Query(default=50, le=200),
):
    filters = {}
    if status:
        filters["status"] = status
    if severity:
        filters["severity"] = severity
    if incident_type:
        filters["incident_type"] = incident_type
    try:
        rows = db.select("incidents", filters=filters, limit=limit, order_by="reported_at")
        return rows
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{incident_id}")
def get_incident(incident_id: str):
    try:
        incident = db.select_one("incidents", {"id": incident_id})
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}")
async def update_incident(incident_id: str, payload: IncidentUpdate):
    existing = db.select_one("incidents", {"id": incident_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Incident not found")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if updates.get("status") == "resolved":
        updates["resolved_at"] = datetime.now(timezone.utc).isoformat()
    if updates.get("status") == "verified":
        updates["verified_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = db.update("incidents", {"id": incident_id}, updates)
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if not result:
        raise HTTPException(status_code=500, detail="Update returned no rows")

    try:
        await manager.broadcast("incident_updated", result[0])
    except Exception:  # noqa: BLE001
        logger.exception("Broadcast failed after incident update (non-fatal)")

    return result[0]


@router.post("/{incident_id}/merge")
async def merge_incidents(incident_id: str, master_id: str):
    if incident_id == master_id:
        raise HTTPException(status_code=400, detail="Cannot merge an incident into itself")
    master = db.select_one("incidents", {"id": master_id})
    duplicate = db.select_one("incidents", {"id": incident_id})
    if not master or not duplicate:
        raise HTTPException(status_code=404, detail="Incident(s) not found")

    try:
        db.update("incidents", {"id": incident_id}, {"status": "duplicate", "duplicate_of": master_id})
        updated_master = duplicate_service.merge_into_master(master_id, duplicate)
        await manager.broadcast("incident_consolidated", updated_master)
        return updated_master
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{incident_id}/summary")
def get_incident_summary(incident_id: str):
    incident = db.select_one("incidents", {"id": incident_id})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    try:
        summary = llm_service.generate_incident_summary(incident, incident.get("report_count", 1))
        recommendations = llm_service.generate_recommendations(incident)
        return {"summary": summary, "recommendations": recommendations}
    except Exception as exc:  # noqa: BLE001
        logger.exception("On-demand summary generation failed")
        raise HTTPException(status_code=502, detail=f"AI summary generation failed: {exc}") from exc


def _to_incident_out(incident: dict) -> dict:
    incident.setdefault("report_count", 1)
    return incident
