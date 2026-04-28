from fastapi import APIRouter
from app.database import db
from datetime import datetime, timezone

router = APIRouter()

alerts_collection = db["alerts"]


def time_ago(ts) -> str:
    """Convert a timestamp to human-readable 'X min ago' format"""
    if not ts:
        return "Recently"
    try:
        now = datetime.now(timezone.utc)
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        diff = now - ts
        seconds = int(diff.total_seconds())
        if seconds < 60:
            return f"{seconds}s ago"
        elif seconds < 3600:
            return f"{seconds // 60} min ago"
        elif seconds < 86400:
            return f"{seconds // 3600} hr ago"
        else:
            return f"{seconds // 86400} day ago"
    except Exception:
        return "Recently"


@router.get("/notifications")
def get_notifications():
    """Returns the latest alerts as notifications"""
    try:
        # Get latest 20 alerts ordered by timestamp desc
        raw = list(
            alerts_collection.find(
                {},
                {"_id": 0}
            ).sort("timestamp", -1).limit(20)
        )

        notifications = []
        for i, a in enumerate(raw):
            risk = str(a.get("risk", "Medium")).capitalize()
            # normalise risk label
            risk_map = {
                "High": "High", "Critical": "Critical",
                "Medium": "Medium", "Low": "Low",
                "Moderate": "Medium"
            }
            risk = risk_map.get(risk, "Medium")

            ntype = "alert"
            if a.get("type", "").lower() in ["system", "model"]:
                ntype = "system"

            title = a.get("title") or (
                f"{a.get('type', 'Disaster')} alert — {a.get('location', 'India')}"
            )

            notifications.append({
                "id": i + 1,
                "type": ntype,
                "title": title,
                "time": time_ago(a.get("timestamp")),
                "severity": risk,
                "read": False,
                "location": a.get("location", ""),
            })

        return {"status": "success", "notifications": notifications}
    except Exception as e:
        return {"status": "error", "notifications": [], "error": str(e)}
