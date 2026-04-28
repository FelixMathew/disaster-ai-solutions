from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
from app.database import db
from app.utils.security import get_current_user

router = APIRouter()
incidents_collection = db["incidents"]

class IncidentCreate(BaseModel):
    type: str
    latitude: float
    longitude: float
    description: str

@router.post("/incidents")
async def create_incident(incident: IncidentCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("email")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    new_incident = {
        "user_id": user_id,
        "type": incident.type,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "description": incident.description,
        "timestamp": datetime.utcnow().isoformat(),
        "verified": False  # Admins can verify later
    }

    result = incidents_collection.insert_one(new_incident)
    return {"message": "Incident reported successfully", "id": str(result.inserted_id)}

@router.get("/incidents")
async def get_incidents():
    # Fetch all recent incidents (e.g., past 48 hours in a real app, here we just fetch all to display)
    cursor = incidents_collection.find().sort("timestamp", -1).limit(100)
    incidents = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        incidents.append(doc)
    return incidents
