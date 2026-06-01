import os
from typing import Dict

try:
    from twilio.rest import Client as TwilioClient
except Exception:
    TwilioClient = None


def send_sms_notification(notification: Dict) -> Dict:
    """Send SMS via Twilio (or simulate if SDK/key missing)."""
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_number = os.environ.get("TWILIO_FROM_NUMBER")

    to_number = notification.get("recipient")
    body = notification.get("message") or notification.get("title") or "Alert"

    if account_sid and auth_token and TwilioClient is not None:
        client = TwilioClient(account_sid, auth_token)
        msg = client.messages.create(body=body, from_=from_number, to=to_number)
        return {"status": "sent", "sid": getattr(msg, 'sid', None)}

    # Fallback simulated response
    return {"status": "simulated", "sid": None}
