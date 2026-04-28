import os
import requests
from fastapi import APIRouter
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "056f714fd8097e5532747a3193ed106e")


@router.get("/weather")
def get_weather(lat: float, lon: float):
    """
    Fetch live weather for given coordinates using OpenWeatherMap API.
    """
    try:
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
        )
        resp = requests.get(url, timeout=10)
        data = resp.json()

        if resp.status_code != 200 or "main" not in data:
            return {"status": "error", "message": data.get("message", "Weather API error")}

        temp = round(data["main"]["temp"])
        feels_like = round(data["main"]["feels_like"])
        humidity = data["main"]["humidity"]
        description = data["weather"][0]["description"].title()
        wind_speed = round(data["wind"]["speed"] * 3.6)  # m/s -> km/h
        city = data.get("name", "Your Location")
        country = data.get("sys", {}).get("country", "")
        weather_id = data["weather"][0]["id"]
        icon = data["weather"][0]["icon"]

        # Determine safety status
        if wind_speed > 70 or weather_id in range(200, 300) or weather_id in range(900, 910):
            status = "DANGER"
        elif wind_speed > 40 or weather_id in range(300, 600):
            status = "WARNING"
        else:
            status = "SAFE"

        return {
            "status": "success",
            "city": city,
            "country": country,
            "temp": temp,
            "feels_like": feels_like,
            "humidity": humidity,
            "description": description,
            "wind_speed": wind_speed,
            "weather_id": weather_id,
            "icon": icon,
            "safety_status": status,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
