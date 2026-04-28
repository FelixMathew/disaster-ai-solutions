from datetime import datetime

from app.services.weather_service import get_weather_data
from app.services.telegram_service import send_telegram_alert
from app.services.email_service import send_email_alert
from app.database import db

alerts_collection = db["alerts"]


def run_prediction():

    weather = get_weather_data()

    humidity = weather["humidity"]
    wind_speed = weather["wind_speed"]
    temperature = weather["temperature"]
    pressure = weather["pressure"]

    alerts = []

    # Flood Detection
    if humidity > 85:

        alert = {
            "type": "Flood",
            "risk": "High",
            "location": "Poonamallee",
            "latitude": 13.0487,
            "longitude": 80.0886,
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        alerts_collection.insert_one(alert)
        alerts.append(alert)

    # Cyclone Detection
    if wind_speed > 20:

        alert = {
            "type": "Cyclone",
            "risk": "High",
            "location": "Poonamallee",
            "latitude": 13.0487,
            "longitude": 80.0886,
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        alerts_collection.insert_one(alert)
        alerts.append(alert)

    # Wildfire Detection
    if temperature > 40 and humidity < 30:

        alert = {
            "type": "Wildfire",
            "risk": "Medium",
            "location": "Poonamallee",
            "latitude": 13.0487,
            "longitude": 80.0886,
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        alerts_collection.insert_one(alert)
        alerts.append(alert)

    # Earthquake Placeholder (needs seismic data API)
    if pressure < 980:

        alert = {
            "type": "Earthquake Risk",
            "risk": "Low",
            "location": "Poonamallee",
            "latitude": 13.0487,
            "longitude": 80.0886,
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

        alerts_collection.insert_one(alert)
        alerts.append(alert)

    # Send Alerts
    for alert in alerts:

        message = f"""
⚠ DisasterAI ALERT

Disaster Type: {alert['type']}
Location: {alert['location']}
Risk Level: {alert['risk']}
Time: {alert['time']}
"""

        send_telegram_alert(message)

        send_email_alert(
            message,
            "yourmail@gmail.com"
        )

    return alerts