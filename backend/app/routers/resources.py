"""
app/routers/resources.py
CRUD for emergency teams/vehicles/equipment/facilities, plus recommendation
and assignment endpoints.
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from app import database as db
from app.schemas import ResourceCreate, AssignmentCreate
from app.services import resource_service, email_service
from app.websocket_manager import manager
from pydantic import BaseModel

logger = logging.getLogger("app.routers.resources")
router = APIRouter(prefix="/resources", tags=["Resources"])


class AssignmentStatusUpdate(BaseModel):
    status: str


def _enrich_assignments(assignments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enrich assignments with resource and incident data."""
    if not assignments:
        return []
    
    resource_ids = list({a.get("resource_id") for a in assignments if a.get("resource_id")})
    incident_ids = list({a.get("incident_id") for a in assignments if a.get("incident_id")})
    
    resources_map: Dict[str, Dict[str, Any]] = {}
    incidents_map: Dict[str, Dict[str, Any]] = {}
    
    if resource_ids:
        try:
            resources = db.select("resources", filters={"id": resource_ids}, limit=500)
            resources_map = {r["id"]: r for r in resources}
        except db.DBError:
            logger.exception("Failed to fetch resources for assignment enrichment")
    
    if incident_ids:
        try:
            incidents = db.select("incidents", filters={"id": incident_ids}, limit=500)
            incidents_map = {i["id"]: i for i in incidents}
        except db.DBError:
            logger.exception("Failed to fetch incidents for assignment enrichment")
    
    enriched = []
    for assignment in assignments:
        resource = resources_map.get(assignment.get("resource_id"), {})
        incident = incidents_map.get(assignment.get("incident_id"), {})
        
        enriched.append({
            **assignment,
            "resource_name": resource.get("name"),
            "resource_type": resource.get("resource_type"),
            "resource_contact": resource.get("contact"),
            "resource_location_lat": resource.get("location_lat"),
            "resource_location_lng": resource.get("location_lng"),
            "incident": {
                "id": incident.get("id"),
                "description": incident.get("description"),
                "incident_type": incident.get("incident_type"),
                "severity": incident.get("severity"),
                "status": incident.get("status"),
                "priority": incident.get("priority"),
                "location_lat": incident.get("location_lat"),
                "location_lng": incident.get("location_lng"),
                "address": incident.get("address"),
            } if incident else None,
        })
    
    return enriched


@router.get("/assignments")
def list_all_assignments(
    status: Optional[str] = None,
    incident_id: Optional[str] = None,
    limit: int = 500,
):
    """Get all assignments with optional filters, enriched with resource and incident data."""
    filters = {}
    if status:
        filters["status"] = status
    if incident_id:
        filters["incident_id"] = incident_id
    
    try:
        assignments = db.select("assignments", filters=filters, limit=limit, order_by="assigned_at")
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    
    return _enrich_assignments(assignments)


@router.post("", status_code=201)
def create_resource(payload: ResourceCreate):
    record = {
        "name": payload.name,
        "resource_type": payload.resource_type.value,
        "status": payload.status.value,
        "capacity": payload.capacity,
        "location_lat": payload.location.lat,
        "location_lng": payload.location.lng,
        "contact": payload.contact,
    }
    try:
        return db.insert("resources", record)
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("")
def list_resources(resource_type: str = None, status: str = None):
    filters = {}
    if resource_type:
        filters["resource_type"] = resource_type
    if status:
        filters["status"] = status
    try:
        return db.select("resources", filters=filters, limit=200)
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/available")
def list_available_resources():
    try:
        return db.select("resources", filters={"status": "available"}, limit=200)
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/{resource_id}/status")
def update_resource_status(resource_id: str, status: str):
    valid = {"available", "dispatched", "maintenance", "unavailable"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"status must be one of {valid}")
    resource = db.select_one("resources", {"id": resource_id})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    try:
        result = db.update("resources", {"id": resource_id}, {"status": status})
        return result[0]
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/recommend/{incident_id}")
def recommend_for_incident(incident_id: str):
    incident = db.select_one("incidents", {"id": incident_id})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    try:
        recommendations = resource_service.recommend_resources(incident)
        if not recommendations:
            return {"recommendations": [], "warning": "No available resources matched this incident."}
        return {"recommendations": recommendations}
    except Exception as exc:  # noqa: BLE001
        logger.exception("Resource recommendation failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/assign", status_code=201)
async def assign_resource(payload: AssignmentCreate):
    try:
        assignment = resource_service.assign_resource(
            payload.incident_id, payload.resource_id, payload.eta_minutes
        )
    except db.DBError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Assignment failed unexpectedly")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    try:
        incident = db.select_one("incidents", {"id": payload.incident_id})
        resource = db.select_one("resources", {"id": payload.resource_id})
        await manager.broadcast("resource_assigned", {"assignment": assignment, "incident_id": payload.incident_id})
        if resource and resource.get("contact"):
            email_service.notify_assignment(incident, resource, resource.get("contact"))
    except Exception:  # noqa: BLE001
        logger.exception("Post-assignment notification/broadcast failed (non-fatal)")

    return assignment


@router.get("/assignments/{incident_id}")
def get_assignments(incident_id: str):
    try:
        return db.select("assignments", filters={"incident_id": incident_id})
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/assignments/{assignment_id}/status")
async def update_assignment_status(assignment_id: str, payload: AssignmentStatusUpdate):
    status = payload.status
    valid = {"assigned", "en_route", "on_scene", "completed", "cancelled"}
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"status must be one of {valid}")
    assignment = db.select_one("assignments", {"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    try:
        result = db.update("assignments", {"id": assignment_id}, {"status": status})
        updated = result[0]
        try:
            await manager.broadcast("assignment_updated", updated)
        except Exception:  # noqa: BLE001
            logger.exception("Assignment update broadcast failed (non-fatal)")
        return updated
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
