import requests
from app.database import db

alerts_collection = db["alerts"]

NOAA_API = "https://www.nhc.noaa.gov/CurrentStorms.json"

def fetch_cyclones():

    response = requests.get(NOAA_API)

    if response.status_code != 200:
        return []

    storms = response.json()

    cyclones = []

    for storm in storms:

        latitude = storm.get("lat")
        longitude = storm.get("lon")

        alert = {
            "type": "Cyclone",
            "risk": "High",
            "location": storm.get("name"),
            "latitude": latitude,
            "longitude": longitude
        }

        alerts_collection.insert_one(alert)

        cyclones.append(alert)

    return cyclones