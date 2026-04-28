from fastapi import APIRouter
from app.services.wildfire_service import fetch_wildfires

router = APIRouter()

@router.get("/wildfires")
def get_wildfires():

    data = fetch_wildfires()

    return {
        "status": "success",
        "wildfires_detected": len(data),
        "data": data
    }