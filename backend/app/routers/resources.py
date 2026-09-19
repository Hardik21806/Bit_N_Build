"""
app/routers/resources.py
CRUD for emergency teams/vehicles/equipment/facilities, plus recommendation
and assignment endpoints.
"""
import logging

from fastapi import APIRouter, HTTPException

from app import database as db
from app.schemas import ResourceCreate, AssignmentCreate
from app.services import resource_service, email_service
from app.websocket_manager import manager

logger = logging.getLogger("app.routers.resources")
router = APIRouter(prefix="/resources", tags=["Resources"])


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
