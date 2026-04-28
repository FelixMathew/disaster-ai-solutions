from fastapi import APIRouter
from app.services.earthquake_service import fetch_earthquakes

router = APIRouter()


@router.get("/earthquakes")
def get_earthquakes():

    earthquakes = fetch_earthquakes()

    return {
        "status": "success",
        "earthquakes_detected": len(earthquakes),
        "data": earthquakes
    }