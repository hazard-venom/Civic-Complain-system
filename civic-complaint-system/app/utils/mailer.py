import smtplib
from email.message import EmailMessage

from app.config import settings


def _smtp_ready() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)


def send_complaint_copy_email(to_email: str, complaint_payload: dict) -> bool:
    if not to_email or not _smtp_ready():
        return False

    msg = EmailMessage()
    msg["Subject"] = f"Complaint Received: {complaint_payload['tracking_id']}"
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = to_email

    body = (
        "Your complaint has been successfully submitted.\n\n"
        f"Complaint Number: {complaint_payload['tracking_id']}\n"
        f"Title: {complaint_payload['title']}\n"
        f"Category: {complaint_payload['category']}\n"
        f"Priority: {complaint_payload['priority']}\n"
        f"Status: {complaint_payload['status']}\n"
        f"Location: {complaint_payload['location']}\n\n"
        "You can track this complaint from the complaint tracker section in the app."
    )
    msg.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception:
        return False


def send_pmo_escalation_email(complaint_payload: dict) -> bool:
    if not settings.PMO_EMAIL or not _smtp_ready():
        return False

    msg = EmailMessage()
    msg["Subject"] = f"PMO Escalation: Complaint {complaint_payload['tracking_id']}"
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = settings.PMO_EMAIL

    officer_line = complaint_payload.get("officer_line") or "Officer details unavailable"

    body = (
        "Complaint escalation alert.\n\n"
        f"Complaint Number: {complaint_payload['tracking_id']}\n"
        f"Title: {complaint_payload['title']}\n"
        f"Category: {complaint_payload['category']}\n"
        f"Priority: {complaint_payload['priority']}\n"
        f"Status: {complaint_payload['status']}\n"
        f"Created At: {complaint_payload['created_at']}\n"
        f"Location: {complaint_payload['location']}\n"
        f"Officer: {officer_line}\n\n"
        "Reason: Complaint remained unresolved beyond configured escalation window."
    )
    msg.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception:
        return False
