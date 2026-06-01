import os
import json
from typing import Dict

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
except Exception:
    # If sendgrid isn't installed, runtime import will fail; callers should handle exceptions.
    SendGridAPIClient = None
    Mail = None


def send_email_notification(notification: Dict) -> Dict:
    """Send email via SendGrid. Expects notification dict with keys: recipient, title, message."""
    api_key = os.environ.get("SENDGRID_API_KEY")
    if not api_key or SendGridAPIClient is None:
        raise RuntimeError("SendGrid not configured or package missing")

    to_email = notification.get("recipient")
    subject = notification.get("title") or "Alert"
    content = notification.get("message") or ""

    # Build message
    message = Mail(
        from_email=os.environ.get("NOTIFY_FROM_EMAIL", "no-reply@example.com"),
        to_emails=to_email,
        subject=subject,
        html_content=content
    )

    client = SendGridAPIClient(api_key)
    resp = client.send(message)

    return {"status_code": resp.status_code, "body": getattr(resp, 'body', None)}
