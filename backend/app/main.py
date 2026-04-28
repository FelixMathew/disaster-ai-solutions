import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_SYS_DLOPEN_VERBOSE"] = "0"
# Prevent TF's blocking DLL diagnostic on Windows
os.environ.setdefault("TF_FORCE_GPU_ALLOW_GROWTH", "false")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth_routes import router as auth_router
from app.routes.prediction_routes import router as prediction_router
from app.routes.alert_routes import router as alert_router
from app.routes.earthquake_routes import router as earthquake_router
from app.routes.wildfire_routes import router as wildfire_router
from app.routes.predict_routes import router as predict_router
from app.routes.incident_routes import router as incident_router
from app.routes.analytics_routes import router as analytics_router
from app.routes.stats_routes import router as stats_router
from app.routes.notification_routes import router as notification_router
from app.routes.weather_routes import router as weather_router
from app.routes.twilio_routes import router as twilio_router

app = FastAPI()

# Allow Railway/Vercel frontend URL via env variable, fallback allows all origins
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8082",
    "http://127.0.0.1:8082",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

if FRONTEND_URL:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not FRONTEND_URL else origins,
    allow_credentials=True if FRONTEND_URL else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")
app.include_router(alert_router, prefix="/api")
app.include_router(earthquake_router, prefix="/api")
app.include_router(wildfire_router, prefix="/api")
app.include_router(predict_router, prefix="/api")
app.include_router(incident_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(notification_router, prefix="/api")
app.include_router(weather_router, prefix="/api")
app.include_router(twilio_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "DisasterAI Backend Connected to MongoDB"}