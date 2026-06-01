Providers and enabling real delivery

This document explains how to enable real delivery providers for email, SMS, and WhatsApp in the backend. The project includes lightweight provider adapters in `backend/app/providers/` that will simulate delivery if SDKs or credentials are not provided. To enable real delivery, follow the steps below for each provider.

1) SendGrid (email)
- Files: `backend/app/providers/sendgrid_provider.py`
- Requirements: install `sendgrid` (already listed in `backend/requirements.txt`).
- Env vars to set:
  - `SENDGRID_API_KEY` — your SendGrid API key
  - `NOTIFY_FROM_EMAIL` — sender email (e.g., no-reply@yourdomain.com)
- Steps:
  1. Create a SendGrid account and API key.
  2. Set the env vars (e.g., export SENDGRID_API_KEY=...).
  3. Restart the backend. Email notifications sent with `channel: "email"` and a `recipient` will be queued and sent by the background task.

2) Twilio (SMS)
- Files: `backend/app/providers/twilio_provider.py`
- Requirements: install `twilio` (already listed in `backend/requirements.txt`).
- Env vars to set:
  - `TWILIO_ACCOUNT_SID` — Twilio account SID
  - `TWILIO_AUTH_TOKEN` — Twilio auth token
  - `TWILIO_FROM_NUMBER` — Twilio phone number to send from (E.164 format)
- Steps:
  1. Create a Twilio account and obtain credentials and a phone number.
  2. Set the env vars and restart the backend.
  3. SMS sends use `channel: "sms"` and `recipient` should be an E.164 phone number.

3) WhatsApp-style messages
- Files: `backend/app/providers/whatsapp_provider.py`
- This adapter is implemented to use Twilio WhatsApp when `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM` are provided. When not configured it operates in development mode and records delivery logs locally so the rest of the system can be tested without an external provider.
- Env vars to set for real delivery:
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (as above)
  - `TWILIO_WHATSAPP_FROM` — your Twilio WhatsApp-enabled sender (e.g., +1415XXXXXXX)

4) Firebase Cloud Messaging (Push)
- The repo includes `firebase-admin` in `backend/requirements.txt`. To enable FCM push you must:
  1. Create a Firebase project and service account key JSON file.
  2. Set `GOOGLE_APPLICATION_CREDENTIALS` to the service account JSON path.
  3. Implement an adapter in `backend/app/providers/fcm_provider.py` using `firebase_admin.messaging`.

5) Running & testing
- Install backend dependencies in a virtualenv and run:
  ```bash
  pip install -r backend/requirements.txt
  python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
  ```
- Send a test notification:
  ```bash
  curl -X POST http://127.0.0.1:8000/api/alerts/send \
    -H 'Content-Type: application/json' \
    -d '{"channel":"email","recipient":"you@example.com","title":"Test","message":"Hello"}'
  ```

Notes:
- Provider adapters will simulate delivery if SDKs or API keys are missing; logs are written to the `delivery_logs` table with status `QUEUED`, `SENT`, `FAILED`, or `simulated` depending on outcome.
- Do not commit API keys to source control. Set them via environment variables or a secure secret manager in production.
