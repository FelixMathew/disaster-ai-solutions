import requests
from app.database import db

alerts_collection = db["alerts"]

NASA_API = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/1/VIIRS_SNPP_NRT/world/1"

def fetch_wildfires():

    response = requests.get(NASA_API)

    if response.status_code != 200:
        return []

    lines = response.text.split("\n")[1:]

    fires = []

    for row in lines[:20]:

        data = row.split(",")

        if len(data) < 3:
            continue

        latitude = float(data[0])
        longitude = float(data[1])

        alert = {
            "type": "Wildfire",
            "risk": "High",
            "location": "Satellite Detection",
            "latitude": latitude,
            "longitude": longitude
        }

        alerts_collection.insert_one(alert)

        fires.append(alert)

    return fires