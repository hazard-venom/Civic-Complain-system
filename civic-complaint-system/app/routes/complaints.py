import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.complaint import Complaint
from app.models.complaint_update import ComplaintUpdate
from app.models.user import User
from app.utils.ai_model import (
    calculate_priority_score,
    choose_higher_priority,
    predict_complaint,
    score_to_priority,
)
from app.utils.complaint_tracker import add_complaint_update
from app.utils.geocode import reverse_geocode
from app.utils.jwt_handler import get_current_user
from app.utils.mailer import send_complaint_copy_email
from app.utils.notifications import create_notification, send_sms_if_enabled


router = APIRouter(prefix="/complaints", tags=["Complaints"])

UPLOAD_DIR = "uploads/complaints"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_complaint_by_identifier(db: Session, complaint_identifier: str) -> Complaint | None:
    if complaint_identifier.isdigit():
        return db.query(Complaint).filter(Complaint.id == int(complaint_identifier)).first()

    return db.query(Complaint).filter(Complaint.tracking_id == complaint_identifier.strip().upper()).first()


@router.post("/", status_code=201)
def create_complaint(
    title: str = Form(...),
    category: str = Form(""),
    description: str = Form(...),
    location: str = Form(""),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "citizen":
        raise HTTPException(403, "Only citizens can file complaints")

    combined_text = f"{title} {description}"
    predicted_category, predicted_priority = predict_complaint(combined_text)
    rule_priority = score_to_priority(calculate_priority_score(combined_text))
    final_priority = choose_higher_priority(predicted_priority, rule_priority)
    final_category = category.strip() if category and category.strip() else predicted_category

    cleaned_location = location.strip() if location and location.strip() else ""
    if not cleaned_location and latitude is not None and longitude is not None:
        try:
            cleaned_location = reverse_geocode(latitude, longitude)
        except Exception:
            cleaned_location = ""
    if not cleaned_location:
        cleaned_location = "Location not provided"

    image_path = None
    if image:
        if image.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(400, "Only JPG or PNG images allowed")

        filename = f"{uuid.uuid4()}_{image.filename}"
        file_location = os.path.join(UPLOAD_DIR, filename)
        with open(file_location, "wb") as buffer:
            buffer.write(image.file.read())
        image_path = f"complaints/{filename}"

    complaint = Complaint(
        tracking_id=f"CMP-{uuid.uuid4().hex[:10].upper()}",
        title=title,
        category=final_category,
        priority=final_priority,
        description=description,
        location=cleaned_location,
        latitude=latitude,
        longitude=longitude,
        image=image_path,
        citizen_id=current_user["user_id"],
    )

    db.add(complaint)
    db.flush()

    add_complaint_update(
        db,
        complaint_id=complaint.id,
        status=complaint.status,
        remark="Complaint submitted by citizen",
        updated_by=current_user["user_id"],
    )

    citizen = db.query(User).filter(User.id == current_user["user_id"]).first()

    complaint_number = complaint.tracking_id or f"ID-{complaint.id}"
    create_notification(
        db,
        user_id=current_user["user_id"],
        title="Complaint Filed",
        message=f"Your complaint {complaint_number} has been submitted successfully.",
    )

    sms_sent, sms_status_message = send_sms_if_enabled(
        citizen,
        f"Civic Complaint filed successfully. Complaint ID: {complaint_number}.",
    )

    db.commit()
    db.refresh(complaint)

    citizen_email = current_user.get("sub", "")
    email_copy_sent = False
    if citizen and citizen.email_notifications:
        email_copy_sent = send_complaint_copy_email(
            citizen_email,
            {
                "tracking_id": complaint_number,
                "title": complaint.title,
                "category": complaint.category,
                "priority": complaint.priority,
                "status": complaint.status,
                "location": complaint.location,
            },
        )

    return {
        "message": "Complaint submitted successfully",
        "complaint_id": complaint.id,
        "tracking_id": complaint.tracking_id,
        "category": complaint.category,
        "priority": complaint.priority,
        "status": complaint.status,
        "location": complaint.location,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "image": image_path,
        "email_copy_sent": email_copy_sent,
        "sms_sent": sms_sent,
        "sms_status_message": sms_status_message,
    }


@router.get("/my")
def my_complaints(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "citizen":
        raise HTTPException(403, "Only citizens can view their complaints")

    complaints = (
        db.query(Complaint)
        .filter(Complaint.citizen_id == current_user["user_id"])
        .order_by(Complaint.id.desc())
        .all()
    )
    return complaints


@router.get("/track/{complaint_identifier}")
def track_complaint(
    complaint_identifier: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    complaint = _get_complaint_by_identifier(db, complaint_identifier)
    if not complaint:
        raise HTTPException(404, "Complaint not found")

    if current_user["role"] == "citizen" and complaint.citizen_id != current_user["user_id"]:
        raise HTTPException(403, "You can only track your own complaints")

    updates = (
        db.query(ComplaintUpdate)
        .filter(ComplaintUpdate.complaint_id == complaint.id)
        .order_by(ComplaintUpdate.created_at.asc())
        .all()
    )

    return {
        "complaint": {
            "id": complaint.id,
            "tracking_id": complaint.tracking_id,
            "title": complaint.title,
            "category": complaint.category,
            "priority": complaint.priority,
            "description": complaint.description,
            "location": complaint.location,
            "latitude": complaint.latitude,
            "longitude": complaint.longitude,
            "status": complaint.status,
            "image": complaint.image,
            "officer_remark": complaint.officer_remark,
            "created_at": complaint.created_at,
        },
        "timeline": [
            {
                "id": item.id,
                "status": item.status,
                "remark": item.remark,
                "updated_by": item.updated_by,
                "created_at": item.created_at,
            }
            for item in updates
        ],
    }


@router.get("/")
def list_complaints(db: Session = Depends(get_db)):
    return db.query(Complaint).all()
