from app.models.notification import Notification
from app.utils.sms_sender import send_sms


def create_notification(db, user_id: int, title: str, message: str, channel: str = "in_app"):
    item = Notification(
        user_id=user_id,
        title=title,
        message=message,
        channel=channel,
    )
    db.add(item)
    return item


def send_sms_if_enabled(user, message: str) -> tuple[bool, str]:
    if not user:
        return False, "User not found"
    if not getattr(user, "sms_notifications", False):
        return False, "SMS notifications are disabled"
    phone = getattr(user, "phone", None)
    if not phone:
        return False, "User phone number not set"
    return send_sms(phone, message)
