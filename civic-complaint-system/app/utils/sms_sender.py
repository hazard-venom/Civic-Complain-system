import requests

from app.config import settings


def _sms_ready() -> bool:
    return bool(settings.SMS_ACCOUNT_SID and settings.SMS_AUTH_TOKEN and settings.SMS_FROM_NUMBER)


def send_sms(to_number: str, message: str) -> tuple[bool, str]:
    if not to_number or not _sms_ready():
        return False, "SMS provider not configured or destination number missing"

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.SMS_ACCOUNT_SID}/Messages.json"
        response = requests.post(
            url,
            data={
                "To": to_number,
                "From": settings.SMS_FROM_NUMBER,
                "Body": message,
            },
            auth=(settings.SMS_ACCOUNT_SID, settings.SMS_AUTH_TOKEN),
            timeout=20,
        )
        if response.status_code in (200, 201):
            return True, "SMS sent successfully"

        detail = response.text.strip() or "Unknown SMS provider error"
        return False, f"SMS failed ({response.status_code}): {detail}"
    except Exception as exc:
        return False, f"SMS request error: {str(exc)}"
