from fastapi import APIRouter, HTTPException
from app.database import db
from app.services.telegram_service import send_telegram_alert
from app.services.email_service import send_email_alert
from app.services.twilio_service import send_whatsapp_sos, send_whatsapp_to_contacts
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional, List
import requests
import os

router = APIRouter()

alerts_collection = db["alerts"]
GOOGLE_MAPS_API_KEY = "AIzaSyAJkxVflV2ETtoOYBRIjR_xPHcN1BRP7g4"

# India bounding box
INDIA_BBOX = {"lat_min": 6.0, "lat_max": 37.6, "lon_min": 68.0, "lon_max": 97.4}


def is_in_india(lat: float, lng: float) -> bool:
    return (
        INDIA_BBOX["lat_min"] <= lat <= INDIA_BBOX["lat_max"]
        and INDIA_BBOX["lon_min"] <= lng <= INDIA_BBOX["lon_max"]
    )


# ===============================
# GET LIVE ALERTS (for dashboard)
# ===============================
@router.get("/alerts/live")
def get_live_alerts():
    alerts = list(alerts_collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(50))
    return {
        "status": "success",
        "alerts": alerts
    }


# ===============================
# GENERATE DEMO ALERT (testing)
# ===============================
@router.get("/generate-demo-alert")
def generate_demo_alert():
    try:
        now = datetime.now(timezone.utc).isoformat()
        alert = {
            "type": "Flood",
            "risk": "High",
            "location": "Poonamallee",
            "latitude": 13.0487,
            "longitude": 80.0886,
            "title": "Flood alert — Poonamallee",
            "description": "Flooding detected in Poonamallee area. Water levels rising.",
            "timestamp": now,
        }
        alerts_collection.insert_one(alert)
        message = """
⚠ DisasterAI Alert

Disaster: Flood
Location: Poonamallee
Risk Level: HIGH

Please move to safe areas immediately.
"""
        send_telegram_alert(message)
        send_email_alert(
            "⚠ DisasterAI Flood Alert",
            message,
            "felixmathewa@gmail.com"
        )
        return {"status": "success", "message": "Demo alert generated"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ===============================
# SOS NEARBY SERVICES (India only)
# ===============================
class SOSRequest(BaseModel):
    lat: float
    lng: float
    disaster_type: Optional[str] = "Emergency"
    message: Optional[str] = None
    family_contacts: Optional[List[str]] = []


@router.post("/sos-nearby")
def sos_nearby(req: SOSRequest):
    if not is_in_india(req.lat, req.lng):
        raise HTTPException(status_code=400, detail="SOS to Nearby Services is available only within India.")

    # OpenStreetMap (Overpass API) Nearby Search for free SOS logic
    overpass_url = "http://overpass-api.de/api/interpreter"
    overpass_query = f"""
    [out:json][timeout:15];
    (
      node["amenity"~"police|hospital|clinic|fire_station"](around:10000,{req.lat},{req.lng});
      way["amenity"~"police|hospital|clinic|fire_station"](around:10000,{req.lat},{req.lng});
    );
    out center;
    """

    found_services = []
    try:
        resp = requests.get(overpass_url, params={'data': overpass_query}, timeout=15)
        data = resp.json()
        
        for element in data.get("elements", []):
            tags = element.get("tags", {})
            amenity = tags.get("amenity", "")
            name = tags.get("name", "Unknown Facility")
            
            # Map OSM tags to our types
            if "police" in amenity:
                t, l, e = "police", "Police Station", "🚔"
            elif "fire_station" in amenity:
                t, l, e = "fire_station", "Fire Station", "🚒"
            else:
                t, l, e = "hospital", "Hospital/Clinic", "🏥"
                
            lat = element.get("lat") or element.get("center", {}).get("lat")
            lon = element.get("lon") or element.get("center", {}).get("lon")
            if not lat or not lon:
                continue
                
            # Limit to 3 per category to mimic original design
            if sum(1 for s in found_services if s["type"] == t) >= 3:
                continue

            found_services.append({
                "type": t,
                "label": l,
                "emoji": e,
                "name": name,
                "address": tags.get("addr:full", tags.get("addr:street", "Address not available")),
                "lat": lat,
                "lng": lon,
                "maps_url": f"https://www.google.com/maps?q={lat},{lon}",
            })
    except Exception as e:
        print(f"Overpass API error: {e}")

    # Persist SOS to DB
    now = datetime.now(timezone.utc).isoformat()
    sos_record = {
        "type": "SOS",
        "disaster_type": req.disaster_type,
        "lat": req.lat,
        "lng": req.lng,
        "message": req.message or f"SOS Alert — {req.disaster_type} emergency",
        "nearby_services": found_services,
        "timestamp": now,
        "maps_link": f"https://www.google.com/maps?q={req.lat},{req.lng}",
    }
    try:
        alerts_collection.insert_one(sos_record)
    except Exception as e:
        print(f"SOS DB insert error: {e}")

    # Notify Telegram with location link
    try:
        services_text = "\n".join(
            [f"  {s['emoji']} {s['name']} — {s['address']}" for s in found_services[:6]]
        )
        telegram_msg = f"""🆘 SOS ALERT — DisasterAI

Type: {req.disaster_type}
Location: {req.lat:.5f}, {req.lng:.5f}
📍 Maps: https://www.google.com/maps?q={req.lat},{req.lng}

📞 Nearby Emergency Services:
{services_text}

{req.message or f'🚨 Emergency SOS raised for {req.disaster_type}. Please dispatch emergency response immediately! Be safe!'}"""
        send_telegram_alert(telegram_msg)
    except Exception as e:
        print(f"Telegram SOS error: {e}")

    # Send Twilio WhatsApp to registered number
    try:
        send_whatsapp_sos()
    except Exception as e:
        print(f"Twilio main WhatsApp error: {e}")

    # Send Twilio WhatsApp to all family contacts
    if req.family_contacts:
        try:
            sent = send_whatsapp_to_contacts(req.family_contacts)
            print(f"Twilio WhatsApp sent to {sent}/{len(req.family_contacts)} family contacts")
        except Exception as e:
            print(f"Twilio family contacts error: {e}")

    # Broadcast SOS email to ALL registered users
    try:
        users_collection = db["users"]
        all_users = list(users_collection.find({}, {"email": 1, "phone": 1, "_id": 0}))
        email_list = [u["email"] for u in all_users if "email" in u]
        from app.services.email_service import send_email_bulk
        subject = f"🆘 EMERGENCY SOS — {req.disaster_type} at your area"
        body = f"""EMERGENCY SOS ALERT

Disaster Type: {req.disaster_type}
GPS Location: {req.lat:.5f}, {req.lng:.5f}
Google Maps: https://www.google.com/maps?q={req.lat},{req.lng}

{req.message or 'An emergency SOS has been raised. Please take immediate action.'}

Emergency Services found nearby:
{chr(10).join([f"- {s['emoji']} {s['name']} ({s['label']}): {s['address']}" for s in found_services])}

Stay safe and follow official instructions.
— DisasterAI Emergency System"""
        send_email_bulk(subject, body, email_list)
    except Exception as e:
        print(f"SOS bulk email error: {e}")

    return {
        "status": "success",
        "services_found": len(found_services),
        "nearby_services": found_services,
        "maps_link": f"https://www.google.com/maps?q={req.lat},{req.lng}",
    }