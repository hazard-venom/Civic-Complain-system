from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.complaint import Complaint
from app.utils.roles import require_role
from app.utils.jwt_handler import get_current_user

router = APIRouter(
    prefix="/officer",
    tags=["Officer"],
    dependencies=[Depends(require_role("officer"))]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 🔹 Only show assigned complaints
@router.get("/my-complaints")
def my_assigned_complaints(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return db.query(Complaint).filter(
        Complaint.officer_id == current_user["user_id"]
    ).all()


# 🔹 Update status (ONLY if assigned to this officer)
@router.put("/complaint/{complaint_id}")
def update_status(
    complaint_id: int,
    status: str,
    remark: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.officer_id == current_user["user_id"]
    ).first()

    if not complaint:
        raise HTTPException(404, "Complaint not found or not assigned to you")

    complaint.status = status
    complaint.officer_remark = remark

    db.commit()

    return {"message": "Complaint updated successfully"}
