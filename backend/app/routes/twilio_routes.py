import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests

router = APIRouter()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "AC2ffa0ece9d5b8fd12f2c20985f292c68")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN",  "46c6953a999d0b410bf433f29690a563")
TWILIO_FROM        = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
TWILIO_TO          = os.getenv("TWILIO_WHATSAPP_TO",  "whatsapp:+918220442691")
TWILIO_CONTENT_SID = os.getenv("TWILIO_CONTENT_SID",  "HXb5b62575e6e4ff6129ad7c8efe1f983e")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8726963059:AAHywpeuhzxzqO0PUs7tV7slmjrH8SUOE4g")
TELEGRAM_CHAT_ID   = os.getenv("TELEGRAM_CHAT_ID",   "1497845067")

EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASS = os.getenv("EMAIL_PASS", "")


class Contact(BaseModel):
    name: str
    number: str
    relation: str


class SOSRequest(BaseModel):
    incident_type: str
    latitude: float
    longitude: float
    location_name: Optional[str] = "Unknown location"
    user_name: Optional[str] = "DisasterAI User"
    contacts: Optional[List[Contact]] = []
    custom_message: Optional[str] = ""


def send_twilio_whatsapp(lat: float, lng: float, incident_type: str, user_name: str, location_name: str):
    """Send WhatsApp SOS via Twilio template — sends the 'Be Safe' message."""
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        now = datetime.now()
        date_str = now.strftime("%d/%m/%Y")
        time_str = now.strftime("%I:%M %p")

        # Use the approved template (HXb5b62575e6e4ff6129ad7c8efe1f983e)
        # Template variables: {"1": "date", "2": "time"}
        msg = client.messages.create(
            from_=TWILIO_FROM,
            content_sid=TWILIO_CONTENT_SID,
            content_variables=json.dumps({"1": date_str, "2": time_str}),
            to=TWILIO_TO
        )
        return {"status": "sent", "sid": msg.sid}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def send_twilio_to_contacts(contacts: List[Contact], lat: float, lng: float, incident_type: str, user_name: str, location_name: str):
    """Send WhatsApp to each family contact directly via Twilio."""
    results = []
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        map_link = f"https://www.google.com/maps?q={lat},{lng}"
        now = datetime.now().strftime("%d %b %Y, %I:%M %p")
        msg_body = (
            f"🚨 EMERGENCY SOS from {user_name}\n"
            f"⚠️ Incident: {incident_type}\n"
            f"📍 Location: {location_name}\n"
            f"🗺️ {map_link}\n"
            f"🕐 {now}\n\n"
            f"⚡ Be Safe! Please help or call 112 immediately."
        )
        for contact in contacts:
            try:
                number = contact.number.replace(" ", "").replace("-", "")
                if not number.startswith("+"):
                    number = f"+{number}"
                m = client.messages.create(
                    from_=TWILIO_FROM,
                    body=msg_body,
                    to=f"whatsapp:{number}"
                )
                results.append({"name": contact.name, "status": "sent", "sid": m.sid})
            except Exception as e:
                results.append({"name": contact.name, "status": "error", "error": str(e)})
    except Exception as e:
        return [{"status": "error", "error": str(e)}]
    return results


def send_telegram_sos(lat: float, lng: float, incident_type: str, user_name: str, location_name: str, custom_msg: str = ""):
    """Send Telegram SOS alert with Be Safe message."""
    try:
        map_link = f"https://www.google.com/maps?q={lat},{lng}"
        now = datetime.now().strftime("%d %b %Y, %I:%M %p")

        message = (
            f"🚨 *EMERGENCY SOS ALERT*\n\n"
            f"👤 *User:* {user_name}\n"
            f"⚠️ *Incident:* {incident_type}\n"
            f"📍 *Location:* {location_name}\n"
            f"🗺️ *Map:* [Click to View]({map_link})\n"
            f"🕐 *Time:* {now}\n"
        )
        if custom_msg:
            message += f"\n💬 *Note:* {custom_msg}\n"
        message += "\n⚡ *Be Safe\\! Help is on the way\\.*"

        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        resp = requests.post(url, json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": False,
        }, timeout=10)

        result = resp.json()
        return {"status": "sent" if resp.status_code == 200 else "error", "detail": result}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def send_telegram_location(lat: float, lng: float):
    """Also send live location as a Telegram location message."""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendLocation"
        resp = requests.post(url, json={
            "chat_id": TELEGRAM_CHAT_ID,
            "latitude": lat,
            "longitude": lng,
        }, timeout=10)
        return {"status": "sent" if resp.status_code == 200 else "error"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


def send_email_sos(lat: float, lng: float, incident_type: str, user_name: str, location_name: str, contacts: List[Contact]):
    """Send SOS email alert."""
    try:
        if not EMAIL_USER or not EMAIL_PASS:
            return {"status": "skipped", "reason": "Email not configured"}

        map_link = f"https://www.google.com/maps?q={lat},{lng}"
        subject = f"🚨 EMERGENCY SOS — {incident_type} | {user_name}"
        contacts_html = "".join(
            f"<tr><td style='padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;'>{c.relation}</td>"
            f"<td style='padding:8px 0;border-bottom:1px solid #f0f0f0;font-weight:600;'>{c.name} — {c.number}</td></tr>"
            for c in contacts
        )
        html = f"""
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
          <div style="background:linear-gradient(135deg,#FFC107,#FF8F00);padding:30px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;">🚨 EMERGENCY SOS</h1>
            <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">DisasterAI Emergency Alert System</p>
          </div>
          <div style="padding:30px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;">User</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600;">{user_name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;">Incident</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-weight:600;color:#f44336;">{incident_type}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;">Location</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">{location_name}</td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;">GPS</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">{lat:.6f}, {lng:.6f}</td></tr>
              <tr><td style="padding:10px 0;color:#666;">Time</td><td style="padding:10px 0;">{datetime.now().strftime('%d %b %Y, %I:%M %p')}</td></tr>
            </table>
            {f'<br><h3 style="margin:0 0 10px;font-size:15px;">Family Contacts Notified</h3><table style="width:100%;">{contacts_html}</table>' if contacts else ''}
            <a href="{map_link}" style="display:block;margin:24px 0;padding:14px;background:linear-gradient(135deg,#FFC107,#FF8F00);color:#fff;text-align:center;border-radius:12px;text-decoration:none;font-weight:700;">
              📍 View Live Location on Google Maps
            </a>
            <p style="color:#888;font-size:13px;text-align:center;">⚡ Be Safe! DisasterAI is monitoring the situation.</p>
          </div>
        </div>
        """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = EMAIL_USER
        msg["To"] = EMAIL_USER
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, EMAIL_USER, msg.as_string())
        return {"status": "sent"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@router.post("/send-sos")
async def send_sos(data: SOSRequest):
    """Master SOS endpoint — Twilio WhatsApp + Telegram text & location + Email."""
    results = {}

    # 1. Twilio template message (Be Safe)
    results["twilio_template"] = send_twilio_whatsapp(
        data.latitude, data.longitude,
        data.incident_type, data.user_name, data.location_name
    )

    # 2. Twilio direct messages to each family contact
    if data.contacts:
        results["twilio_contacts"] = send_twilio_to_contacts(
            data.contacts, data.latitude, data.longitude,
            data.incident_type, data.user_name, data.location_name
        )

    # 3. Telegram text message
    results["telegram_text"] = send_telegram_sos(
        data.latitude, data.longitude,
        data.incident_type, data.user_name, data.location_name,
        data.custom_message or ""
    )

    # 4. Telegram location pin
    results["telegram_location"] = send_telegram_location(data.latitude, data.longitude)

    # 5. Email
    results["email"] = send_email_sos(
        data.latitude, data.longitude,
        data.incident_type, data.user_name, data.location_name,
        data.contacts or []
    )

    map_link = f"https://www.google.com/maps?q={data.latitude},{data.longitude}"
    results["map_link"] = map_link

    return {"success": True, "results": results, "map_link": map_link}


@router.post("/share-location")
async def share_location(data: dict):
    """Silent SOS/Location drop endpoint targeting Telegram ONLY."""
    lat = data.get("latitude")
    lng = data.get("longitude")
    user = data.get("user_name", "User")
    
    if lat is None or lng is None:
        raise HTTPException(status_code=400, detail="Missing latitude/longitude")
        
    map_link = f"https://www.google.com/maps?q={lat},{lng}"
    now = datetime.now().strftime("%d %b %Y, %I:%M %p")
    
    msg = (
        f"📍 *Location Shared*\n\n"
        f"👤 *From:* {user}\n"
        f"🗺️ *Map:* [Click to View]({map_link})\n"
        f"🕐 *Time:* {now}\n"
    )
    
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        resp = requests.post(url, json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": msg,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": False,
        }, timeout=10)
        
        # Also ping the location pin
        send_telegram_location(lat, lng)
        return {"status": "sent", "telegram_response": resp.json()}
    except Exception as e:
        return {"status": "error", "error": str(e)}
