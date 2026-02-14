from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.utils.roles import require_role
from app.models.complaint import Complaint
from pydantic import BaseModel
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role("admin"))]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.put("/change-role")
def change_user_role(
    email: str,
    role: str,
    db: Session = Depends(get_db)
):
    if role not in ["citizen", "officer", "admin"]:
        raise HTTPException(400, "Invalid role")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.role = role
    db.commit()

    return {
        "message": "Role updated successfully",
        "email": user.email,
        "new_role": user.role
    }
@router.get("/officers")
def get_officers(db: Session = Depends(get_db)):
    officers = db.query(User).filter(User.role == "officer").all()

    return officers




class AssignRequest(BaseModel):
    officer_id: int


@router.put("/assign/{complaint_id}")
def assign_officer(
    complaint_id: int,
    data: AssignRequest,
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(404, "Complaint not found")

    officer = db.query(User).filter(
        User.id == data.officer_id,
        User.role == "officer"
    ).first()

    if not officer:
        raise HTTPException(404, "Officer not found")

    complaint.officer_id = data.officer_id
    complaint.status = "In Progress"

    db.commit()

    return {"message": "Officer assigned successfully"}
