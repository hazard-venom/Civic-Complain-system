import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.complaint import Complaint
from app.utils.jwt_handler import get_current_user
#from app.utils.image_gps import extract_gps
#from app.utils.geocode import reverse_geocode



router = APIRouter(prefix="/complaints", tags=["Complaints"])

UPLOAD_DIR = "uploads/complaints"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# Create Complaint with Image
# -----------------------------
@router.post("/", status_code=201)
def create_complaint(
    title: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "citizen":
        raise HTTPException(403, "Only citizens can file complaints")

    image_path = None
    #latitude = None
    #longitude = None
    #final_location = location  # fallback

    # -----------------------------
    # -----------------------------
# Save image (if provided)
# -----------------------------
    if image:
        if image.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(400, "Only JPG or PNG images allowed")

        filename = f"{uuid.uuid4()}_{image.filename}"

        # Physical file path
        file_location = os.path.join(UPLOAD_DIR, filename)

        # Save file to disk
        with open(file_location, "wb") as buffer:
            buffer.write(image.file.read())

        # Save only relative path in DB
        image_path = f"complaints/{filename}"

        # -----------------------------
        # Extract GPS from image
        # -----------------------------
        '''gps = extract_gps(image_path)
        if gps:
            latitude, longitude = gps

            # -----------------------------
            # Reverse geocode GPS → address
            # -----------------------------
            final_location = reverse_geocode(latitude, longitude)'''

    # -----------------------------
    # Save complaint
    # -----------------------------
    complaint = Complaint(
        title=title,
        category=category,
        description=description,
        #location=final_location,
        #latitude=latitude,
        #longitude=longitude,
        image=image_path,
        citizen_id=current_user["user_id"]
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    return {
        "message": "Complaint submitted successfully",
        "complaint_id": complaint.id,
        #"location": final_location,
        #"latitude": latitude,
        #"longitude": longitude,
        "image": image_path
    }

# -----------------------------
# My Complaints (Citizen only)
# -----------------------------
@router.get("/my")
def my_complaints(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "citizen":
        raise HTTPException(403, "Only citizens can view their complaints")

    complaints = db.query(Complaint).filter(
        Complaint.citizen_id == current_user["user_id"]
    ).all()

    return complaints


# -----------------------------
# List ALL complaints (public)
# -----------------------------
@router.get("/")
def list_complaints(db: Session = Depends(get_db)):
    return db.query(Complaint).all()
