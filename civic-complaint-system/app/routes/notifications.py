from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
import re

from app.database import SessionLocal
from app.models.notification import Notification
from app.models.user import User
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class NotificationSettingsUpdate(BaseModel):
    phone: str
    sms_notifications: bool
    email_notifications: bool


@router.get("/my")
def my_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user["user_id"])
    if unread_only:
        query = query.filter(Notification.is_read.is_(False))
    return query.order_by(Notification.created_at.desc()).limit(50).all()


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    item = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user["user_id"])
        .first()
    )
    if not item:
        raise HTTPException(404, "Notification not found")

    item.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == current_user["user_id"], Notification.is_read.is_(False))
        .all()
    )
    for row in rows:
        row.is_read = True
    db.commit()
    return {"message": "All notifications marked as read", "count": len(rows)}


@router.get("/settings")
def get_notification_settings(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(404, "User not found")

    return {
        "phone": user.phone,
        "sms_notifications": bool(user.sms_notifications),
        "email_notifications": bool(user.email_notifications),
    }


@router.put("/settings")
def update_notification_settings(
    payload: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(404, "User not found")

    normalized_phone = payload.phone.strip()
    if not normalized_phone:
        raise HTTPException(400, "Phone number is required")
    if not re.fullmatch(r"\+[1-9][0-9]{7,14}", normalized_phone):
        raise HTTPException(400, "Phone must be in E.164 format, e.g. +919876543210")

    duplicate = db.query(User).filter(User.phone == normalized_phone, User.id != user.id).first()
    if duplicate:
        raise HTTPException(400, "Phone number already in use")

    user.phone = normalized_phone
    user.sms_notifications = payload.sms_notifications
    user.email_notifications = payload.email_notifications
    db.commit()

    return {
        "message": "Notification settings updated",
        "phone": user.phone,
        "sms_notifications": bool(user.sms_notifications),
        "email_notifications": bool(user.email_notifications),
    }
