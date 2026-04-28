from app.services.weather_service import get_weather_data
from app.database import db

alerts_collection = db["alerts"]

def detect_flood():

    weather = get_weather_data()

    humidity = weather["humidity"]
    wind = weather["wind_speed"]

    if humidity > 85:

        alert = {
            "type": "Flood",
            "risk": "High",
            "location": "Poonamallee",
            "latitude": 13.0487,
            "longitude": 80.0886
        }

        alerts_collection.insert_one(alert)

        return alert

    return None