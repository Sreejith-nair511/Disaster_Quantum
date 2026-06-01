from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
from datetime import datetime, timezone

from backend.app.database import DB_PATH

router = APIRouter()


class SendNotificationRequest(BaseModel):
    channel: str
    recipient: Optional[str] = None
    region: Optional[str] = None
    severity: Optional[str] = None
    title: str
    message: str
    metadata: Optional[dict] = None


class SubscribeRequest(BaseModel):
    contact: str
    channel: str
    region: Optional[str] = None
    user_id: Optional[str] = None
    preferences: Optional[dict] = None


class AcknowledgeRequest(BaseModel):
    notification_id: int


@router.post("/send")
def send_notification(req: SendNotificationRequest):
    # Import DB helpers lazily to avoid circular imports during app startup
    from backend.app.database import log_notification

    # Log notification
    record = log_notification(req.channel, req.recipient, req.region, req.severity, req.title, req.message, req.metadata)

    # Simulate delivery: in production this would enqueue SMS/Email/Push/Voice
    # For now, write a delivery_logs entry if DB is available
    try:
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO delivery_logs (notification_id, channel, recipient, status, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)",
                       (record["id"], req.channel, req.recipient or '', 'SENT', datetime.now(timezone.utc).isoformat(), json.dumps({})))
        conn.commit()
        conn.close()
    except Exception:
        pass

    return {"status": "queued", "notification": record}


@router.get("/history")
def history(limit: int = 50):
    from backend.app.database import get_notification_history
    return get_notification_history(limit)


@router.post("/subscribe")
def subscribe(req: SubscribeRequest):
    from backend.app.database import add_subscription
    rec = add_subscription(req.contact, req.channel, req.region, req.user_id, req.preferences)
    return {"status": "subscribed", "subscription": rec}


@router.post("/acknowledge")
def acknowledge(req: AcknowledgeRequest):
    try:
        from backend.app.database import acknowledge_notification
        acknowledge_notification(req.notification_id)
        return {"status": "acknowledged", "id": req.notification_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subscriptions")
def list_subscriptions(region: Optional[str] = None):
    from backend.app.database import get_subscriptions
    return get_subscriptions(region)
