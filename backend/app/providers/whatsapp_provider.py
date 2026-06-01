import os
from typing import Dict

try:
    # Many WhatsApp integrations use Twilio's API; if Twilio is available we'll use it
    from twilio.rest import Client as TwilioClient
except Exception:
    TwilioClient = None


def send_whatsapp_notification(notification: Dict) -> Dict:
    """Send a WhatsApp-style message via configured provider or simulate delivery."""
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_whatsapp = os.environ.get("TWILIO_WHATSAPP_FROM")

    to = notification.get("recipient")
    body = notification.get("message") or notification.get("title") or "Alert"

    if account_sid and auth_token and TwilioClient is not None and from_whatsapp:
        client = TwilioClient(account_sid, auth_token)
        msg = client.messages.create(body=body, from_=f"whatsapp:{from_whatsapp}", to=f"whatsapp:{to}")
        return {"status": "sent", "sid": getattr(msg, 'sid', None)}

    # Simulated delivery for development
    return {"status": "simulated", "sid": None}
