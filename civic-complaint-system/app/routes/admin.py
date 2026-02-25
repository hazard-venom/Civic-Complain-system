from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.complaint import Complaint
from app.models.user import User
from app.utils.complaint_tracker import add_complaint_update
from app.utils.notifications import create_notification, send_sms_if_enabled
from app.utils.pmo_escalation import run_pmo_escalation_check
from app.utils.roles import require_role

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role("admin"))],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.put("/change-role")
def change_user_role(email: str, role: str, db: Session = Depends(get_db)):
    if role not in ["citizen", "officer", "admin"]:
        raise HTTPException(400, "Invalid role")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.role = role
    db.commit()

    return {"message": "Role updated successfully", "email": user.email, "new_role": user.role}


@router.get("/officers")
def get_officers(db: Session = Depends(get_db)):
    officers = db.query(User).filter(User.role == "officer").all()
    return officers


class AssignRequest(BaseModel):
    officer_id: int


@router.put("/assign/{complaint_id}")
def assign_officer(complaint_id: int, data: AssignRequest, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(404, "Complaint not found")

    officer = db.query(User).filter(User.id == data.officer_id, User.role == "officer").first()
    if not officer:
        raise HTTPException(404, "Officer not found")

    complaint.officer_id = data.officer_id
    complaint.status = "In Progress"

    add_complaint_update(
        db,
        complaint_id=complaint.id,
        status=complaint.status,
        remark=f"Assigned to officer {officer.name} (ID: {officer.id})",
    )

    citizen = db.query(User).filter(User.id == complaint.citizen_id).first()
    complaint_number = complaint.tracking_id or f"ID-{complaint.id}"

    create_notification(
        db,
        user_id=complaint.citizen_id,
        title="Complaint Assigned",
        message=f"Complaint {complaint_number} is now assigned and in progress.",
    )
    send_sms_if_enabled(
        citizen,
        f"Update: Complaint {complaint_number} is assigned and in progress.",
    )

    db.commit()
    return {"message": "Officer assigned successfully"}


@router.post("/run-pmo-escalation")
def run_pmo_escalation_now(db: Session = Depends(get_db)):
    escalated = run_pmo_escalation_check(db)
    return {"message": "PMO escalation check completed", "escalated_count": escalated}
