"""
app/services/email_service.py
Sends notification emails via SMTP with retry + logging. Failures never
crash the caller — they are logged to the notifications_log table.
"""
import logging
import smtplib
import ssl
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from app.config import get_settings
from app import database as db

logger = logging.getLogger("app.email_service")
settings = get_settings()


def _send_smtp(to_addrs: List[str], subject: str, body: str) -> None:
    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = ", ".join(to_addrs)
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
        server.starttls(context=context)
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, to_addrs, msg.as_string())


def send_email(
    to_addrs: Optional[List[str]],
    subject: str,
    body: str,
    max_retries: int = 2,
) -> bool:
    """Sends an email, retries transient failures, and logs the outcome.
    Returns True on success, False otherwise — never raises."""
    recipients = to_addrs or settings.alert_recipient_list
    if not recipients:
        logger.warning("No email recipients configured; skipping send for '%s'", subject)
        return False

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured; skipping email '%s'", subject)
        _log_notification(recipients, subject, body, "skipped_no_credentials")
        return False

    last_error = None
    for attempt in range(1, max_retries + 2):
        try:
            _send_smtp(recipients, subject, body)
            _log_notification(recipients, subject, body, "sent")
            return True
        except (smtplib.SMTPException, ssl.SSLError, OSError) as exc:
            last_error = exc
            logger.warning("Email send attempt %s/%s failed: %s", attempt, max_retries + 1, exc)
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            logger.exception("Unexpected error sending email")
            break

    logger.error("Failed to send email '%s' after retries: %s", subject, last_error)
    _log_notification(recipients, subject, body, "failed", error=str(last_error))
    return False


def _log_notification(recipients: List[str], subject: str, body: str, status: str, error: str = None) -> None:
    try:
        db.insert("notifications_log", {
            "recipient": ", ".join(recipients),
            "channel": "email",
            "subject": subject,
            "body": body,
            "status": status,
            "error": error,
            "sent_at": datetime.now(timezone.utc).isoformat(),
        })
    except db.DBError:
        logger.warning("Could not persist notification log entry (non-fatal)")


def notify_critical_incident(incident: dict) -> bool:
    subject = f"[CRITICAL] {incident.get('incident_type', 'Incident')} reported"
    body = (
        f"A CRITICAL severity incident has been reported.\n\n"
        f"Type: {incident.get('incident_type')}\n"
        f"Severity: {incident.get('severity')}\n"
        f"Priority: {incident.get('priority')}\n"
        f"Location: {incident.get('address') or (incident.get('location_lat'), incident.get('location_lng'))}\n"
        f"Description: {incident.get('description')}\n"
        f"Incident ID: {incident.get('id')}\n\n"
        f"Please review and dispatch resources immediately."
    )
    return send_email(None, subject, body)


def notify_escalation(incident: dict, reason: str) -> bool:
    subject = f"[ESCALATION] Incident {incident.get('id')} requires attention"
    body = (
        f"An incident requires escalation.\n\n"
        f"Reason: {reason}\n"
        f"Type: {incident.get('incident_type')}\n"
        f"Severity: {incident.get('severity')}\n"
        f"Status: {incident.get('status')}\n"
        f"Reported at: {incident.get('reported_at')}\n"
        f"Incident ID: {incident.get('id')}"
    )
    return send_email(None, subject, body)


def notify_resource_shortage(incident: dict, resource_type: str) -> bool:
    subject = f"[RESOURCE SHORTAGE] No {resource_type} available"
    body = (
        f"No available '{resource_type}' resources could be assigned to incident "
        f"{incident.get('id')} ({incident.get('incident_type')}, severity={incident.get('severity')}).\n"
        f"Please arrange alternate resources or mutual aid."
    )
    return send_email(None, subject, body)


def notify_assignment(incident: dict, resource: dict, contact_email: Optional[str] = None) -> bool:
    subject = f"[DISPATCH] You have been assigned to incident {incident.get('id')}"
    body = (
        f"Resource '{resource.get('name')}' has been assigned to an incident.\n\n"
        f"Incident type: {incident.get('incident_type')}\n"
        f"Severity: {incident.get('severity')}\n"
        f"Location: {incident.get('address') or (incident.get('location_lat'), incident.get('location_lng'))}\n"
        f"Description: {incident.get('description')}"
    )
    recipients = [contact_email] if contact_email else None
    return send_email(recipients, subject, body)
