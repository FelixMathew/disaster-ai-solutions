import schedule
import time

from app.services.disaster_engine import run_prediction
from app.services.earthquake_service import fetch_earthquakes
from app.services.wildfire_service import fetch_wildfires


def disaster_monitor():

    try:

        print("\n🌍 Checking Disaster Systems...\n")

        # Flood / Weather AI prediction
        alerts = run_prediction()

        if alerts:
            print("🚨 Flood Prediction Alerts:")
            for alert in alerts:
                print(alert)
        else:
            print("✅ No flood risk detected")


        # Earthquake monitoring
        earthquakes = fetch_earthquakes()

        if earthquakes:
            print("🌍 Earthquakes detected:", len(earthquakes))
        else:
            print("✅ No earthquakes detected")


        # Wildfire monitoring
        fires = fetch_wildfires()

        if fires:
            print("🔥 Wildfires detected:", len(fires))
        else:
            print("✅ No wildfire activity")


        print("\n-----------------------------")

    except Exception as e:
        print("❌ Error in monitoring system:", e)


# Run prediction immediately when system starts
disaster_monitor()


# Run every 5 minutes
schedule.every(5).minutes.do(disaster_monitor)

print("🚀 DisasterAI Monitoring System Started...")

while True:

    schedule.run_pending()
    time.sleep(5)