import requests
from app.database import db
from datetime import datetime

alerts_collection = db["alerts"]

# Use past 24hr significant feed — covers more India earthquakes
USGS_API = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"

# India bounding box (approximate)
INDIA_LAT_MIN, INDIA_LAT_MAX = 6.5, 37.5
INDIA_LON_MIN, INDIA_LON_MAX = 68.0, 97.5


def fetch_earthquakes():
    try:
        response = requests.get(USGS_API, timeout=10)
        data = response.json()
    except Exception:
        return []

    earthquakes = []

    for quake in data.get("features", []):
        props = quake.get("properties", {})
        geo = quake.get("geometry", {})
        coords = geo.get("coordinates", [None, None, None])

        magnitude = props.get("mag")
        location = props.get("place", "Unknown")
        longitude = coords[0]
        latitude = coords[1]
        quake_time = props.get("time")

        if magnitude is None or latitude is None or longitude is None:
            continue

        # Include India-region earthquakes (mag >= 2.5) or global M >= 5
        in_india = (
            INDIA_LAT_MIN <= latitude <= INDIA_LAT_MAX
            and INDIA_LON_MIN <= longitude <= INDIA_LON_MAX
        )

        if not (in_india and magnitude >= 2.5) and not magnitude >= 5.0:
            continue

        risk = (
            "CRITICAL" if magnitude >= 6.5
            else "HIGH" if magnitude >= 5.5
            else "MODERATE" if magnitude >= 4.5
            else "LOW"
        )

        time_str = ""
        if quake_time:
            try:
                time_str = datetime.utcfromtimestamp(quake_time / 1000).strftime("%Y-%m-%d %H:%M UTC")
            except Exception:
                time_str = ""

        alert = {
            "type": "Earthquake",
            "risk": risk,
            "magnitude": round(magnitude, 1),
            "location": location,
            "latitude": latitude,
            "longitude": longitude,
            "time": time_str,
        }

        earthquakes.append(alert)

    return earthquakes