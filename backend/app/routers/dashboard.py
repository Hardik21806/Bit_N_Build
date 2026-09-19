"""
app/routers/dashboard.py
Real-time monitoring dashboard endpoints + WebSocket feed + alerts.
"""
import logging
from collections import Counter

from fastapi import APIRouter, HTTPException, WebSocket

from app import database as db
from app.websocket_manager import handle_dashboard_socket

logger = logging.getLogger("app.routers.dashboard")
router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/overview")
def dashboard_overview():
    try:
        active = db.select(
            "incidents",
            filters={},
            limit=500,
            order_by="reported_at",
        )
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    active = [i for i in active if i.get("status") not in ("resolved", "closed", "duplicate")]

    severity_counts = Counter(i.get("severity", "unknown") for i in active)
    status_counts = Counter(i.get("status", "unknown") for i in active)
    type_counts = Counter(i.get("incident_type", "unknown") for i in active)

    try:
        assignments = db.select("assignments", filters={}, limit=500)
    except db.DBError:
        assignments = []

    assigned_incident_ids = {a.get("incident_id") for a in assignments}

    return {
        "active_emergencies": len(active),
        "severity_breakdown": dict(severity_counts),
        "status_breakdown": dict(status_counts),
        "type_breakdown": dict(type_counts),
        "incidents_with_teams_assigned": len(assigned_incident_ids),
        "incidents": active,
    }


@router.get("/dashboard/alerts")
def dashboard_alerts(status: str = "active"):
    filters = {}
    if status and status != "all":
        filters["status"] = status
    try:
        return db.select("alerts", filters=filters, limit=200, order_by="created_at")
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


from datetime import datetime, timezone

@router.patch("/dashboard/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str):
    alert = db.select_one("alerts", {"id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    try:
        result = db.update("alerts", {"id": alert_id}, {"status": "acknowledged"})
        return result[0]
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.patch("/dashboard/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    alert = db.select_one("alerts", {"id": alert_id})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    try:
        result = db.update("alerts", {"id": alert_id}, {
            "status": "resolved",
            "resolved_at": datetime.now(timezone.utc).isoformat()
        })
        return result[0]
    except db.DBError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    await handle_dashboard_socket(websocket)
