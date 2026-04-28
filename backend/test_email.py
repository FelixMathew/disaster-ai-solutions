from app.services.email_service import send_email_alert

send_email_alert(
    "⚠ DisasterAI Test Alert\nFlood risk detected in Poonamallee",
    "yourmail@gmail.com"
)