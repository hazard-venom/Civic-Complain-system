from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.complaint import Complaint
from app.models.user import User
from app.utils.complaint_tracker import add_complaint_update
from app.utils.jwt_handler import get_current_user
from app.utils.notifications import create_notification, send_sms_if_enabled
from app.utils.roles import require_role

router = APIRouter(
    prefix="/officer",
    tags=["Officer"],
    dependencies=[Depends(require_role("officer"))],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/my-complaints")
def my_assigned_complaints(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return db.query(Complaint).filter(Complaint.officer_id == current_user["user_id"]).all()


@router.get("/accounts")
def list_accounts(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    return users


@router.put("/promote/{user_id}")
def promote_citizen_to_officer(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    if user.role == "admin":
        raise HTTPException(400, "Admin role cannot be changed from officer panel")

    if user.role == "officer":
        return {"message": "User is already an officer", "user_id": user.id, "role": user.role}

    if user.role != "citizen":
        raise HTTPException(400, "Only citizens can be promoted from this panel")

    user.role = "officer"
    db.commit()

    return {"message": "Citizen promoted to officer successfully", "user_id": user.id, "role": user.role}


@router.put("/complaint/{complaint_id}")
def update_status(
    complaint_id: int,
    status: str,
    remark: str = "",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id, Complaint.officer_id == current_user["user_id"])
        .first()
    )

    if not complaint:
        raise HTTPException(404, "Complaint not found or not assigned to you")

    complaint.status = status
    complaint.officer_remark = remark

    add_complaint_update(
        db,
        complaint_id=complaint.id,
        status=status,
        remark=remark or "Status updated by officer",
        updated_by=current_user["user_id"],
    )

    citizen = db.query(User).filter(User.id == complaint.citizen_id).first()
    complaint_number = complaint.tracking_id or f"ID-{complaint.id}"
    create_notification(
        db,
        user_id=complaint.citizen_id,
        title="Complaint Status Updated",
        message=f"Complaint {complaint_number} status changed to {status}.",
    )
    send_sms_if_enabled(
        citizen,
        f"Update: Complaint {complaint_number} status is now {status}.",
    )

    db.commit()
    return {"message": "Complaint updated successfully"}
