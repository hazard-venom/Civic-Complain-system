import asyncio
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.complaint import Complaint
from app.models.user import User
from app.utils.mailer import send_pmo_escalation_email


def _officer_line(officer: User | None) -> str:
    if not officer:
        return "Not assigned"
    return f"{officer.name} (ID: {officer.id})"


def run_pmo_escalation_check(db: Session) -> int:
    if not settings.PMO_EMAIL:
        return 0

    threshold_time = datetime.utcnow() - timedelta(hours=settings.PMO_ESCALATION_HOURS)

    overdue = (
        db.query(Complaint)
        .filter(Complaint.status != "Resolved")
        .filter(Complaint.created_at <= threshold_time)
        .filter(Complaint.pmo_escalated.is_(False))
        .all()
    )

    escalated_count = 0
    for complaint in overdue:
        officer = None
        if complaint.officer_id:
            officer = db.query(User).filter(User.id == complaint.officer_id).first()

        sent = send_pmo_escalation_email(
            {
                "tracking_id": complaint.tracking_id or f"ID-{complaint.id}",
                "title": complaint.title,
                "category": complaint.category,
                "priority": complaint.priority,
                "status": complaint.status,
                "created_at": complaint.created_at,
                "location": complaint.location,
                "officer_line": _officer_line(officer),
            }
        )

        if sent:
            complaint.pmo_escalated = True
            complaint.pmo_escalated_at = datetime.utcnow()
            escalated_count += 1

    if escalated_count > 0:
        db.commit()

    return escalated_count


async def pmo_escalation_worker(stop_event: asyncio.Event):
    while not stop_event.is_set():
        db = SessionLocal()
        try:
            run_pmo_escalation_check(db)
        except Exception:
            db.rollback()
        finally:
            db.close()

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=max(60, settings.PMO_CHECK_INTERVAL_MINUTES * 60))
        except asyncio.TimeoutError:
            continue
