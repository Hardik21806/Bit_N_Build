"""
app/services/escalation_scheduler.py
Background job (APScheduler) that periodically scans open incidents for
SLA breaches and creates escalation alerts + emails + WebSocket broadcasts.
"""
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app import database as db
from app.config import get_settings
from app.services import email_service

logger = logging.getLogger("app.escalation_scheduler")
settings = get_settings()

scheduler = AsyncIOScheduler()


def _parse_ts(value):
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:  # noqa: BLE001
        return None


async def check_escalations():
    """Runs every ESCALATION_CHECK_INTERVAL_SECONDS. Any exception here is
    caught so a single bad run never kills the scheduler."""
    try:
        incidents = db.select("incidents", filters={}, limit=500)
    except db.DBError as exc:
        logger.error("Escalation check could not load incidents: %s", exc)
        return
    except Exception:  # noqa: BLE001
        logger.exception("Unexpected error loading incidents for escalation check")
        return

    now = datetime.now(timezone.utc)
    open_statuses = {"reported", "verified", "dispatched", "in_progress"}

    for inc in incidents:
        try:
            if inc.get("status") not in open_statuses:
                continue

            sla_deadline = _parse_ts(inc.get("sla_deadline"))
            if not sla_deadline or now <= sla_deadline:
                continue

            existing_alert = db.select_one("alerts", {"incident_id": inc["id"], "alert_type": "delayed_response"})
            if existing_alert and existing_alert.get("status") != "resolved":
                continue

            message = (
                f"Incident {inc['id']} ({inc.get('incident_type')}, severity={inc.get('severity')}) "
                f"breached its SLA deadline while still in status '{inc.get('status')}'."
            )
            try:
                db.insert("alerts", {
                    "incident_id": inc["id"],
                    "alert_type": "delayed_response",
                    "message": message,
                    "status": "active",
                    "created_at": now.isoformat(),
                })
            except db.DBError:
                logger.error("Could not persist escalation alert for incident %s", inc["id"])

            try:
                email_service.notify_escalation(inc, "SLA deadline breached")
            except Exception:  # noqa: BLE001
                logger.exception("Escalation email failed for incident %s (non-fatal)", inc["id"])

            try:
                from app.websocket_manager import manager
                await manager.broadcast("incident_escalated", {"incident_id": inc["id"], "message": message})
            except Exception:  # noqa: BLE001
                logger.exception("Escalation broadcast failed for incident %s (non-fatal)", inc["id"])

        except Exception:  # noqa: BLE001
            logger.exception("Error processing escalation check for incident %s", inc.get("id"))
            continue


def start_scheduler():
    try:
        scheduler.add_job(
            check_escalations,
            "interval",
            seconds=settings.ESCALATION_CHECK_INTERVAL_SECONDS,
            id="escalation_check",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("Escalation scheduler started (interval=%ss)", settings.ESCALATION_CHECK_INTERVAL_SECONDS)
    except Exception:  # noqa: BLE001
        logger.exception("Failed to start escalation scheduler; escalation alerts will not run automatically")


def stop_scheduler():
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
    except Exception:  # noqa: BLE001
        logger.exception("Error shutting down scheduler")
