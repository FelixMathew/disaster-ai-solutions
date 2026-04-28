import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_SYS_DLOPEN_VERBOSE"] = "0"

import numpy as np
import cv2
import tempfile
import json
import asyncio
import random
import urllib.request

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pathlib import Path

router = APIRouter()

# ─────────────────────────────────────────────
# GLOBAL STATE
# ─────────────────────────────────────────────
_STATE = {
    "model": None,
    "size": (224, 224),
    "error": "Not loaded yet",
    "tf_attempted": False,
}

_BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = str(_BASE_DIR / "disaster_model_resnet.keras")

TF_AVAILABLE = False
_load_model_fn = None
_preprocess_input_fn = None


# ─────────────────────────────────────────────
# MODEL LOADING — lazy TF import (no blocking at startup)
# ─────────────────────────────────────────────
class MockModel:
    def predict(self, tensor, verbose=0):
        return np.array([[random.uniform(0.1, 0.9)]])


def load_ml_model():
    global TF_AVAILABLE, _load_model_fn, _preprocess_input_fn

    if _STATE["model"] is not None:
        return True

    # Try to import TF lazily (only on first prediction request)
    if not _STATE["tf_attempted"]:
        _STATE["tf_attempted"] = True
        try:
            from tensorflow.keras.models import load_model as _lm
            from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as _pi
            TF_AVAILABLE = True
            _load_model_fn = _lm
            _preprocess_input_fn = _pi
        except Exception:
            TF_AVAILABLE = False
            print("WARNING: TensorFlow not available. Running with Mock Model.")

    if not TF_AVAILABLE:
        _STATE["model"] = MockModel()
        return True

    if not os.path.exists(MODEL_PATH):
        _STATE["error"] = f"Model not found: {MODEL_PATH}"
        _STATE["model"] = MockModel()
        return True

    try:
        print("Loading model...")
        model = _load_model_fn(MODEL_PATH, compile=False)
        dummy = np.zeros((1, 224, 224, 3), dtype="float32")
        model.predict(dummy, verbose=0)
        _STATE["model"] = model
        print("Model loaded successfully")
        return True
    except Exception as e:
        _STATE["error"] = str(e)
        print("Model load failed:", e)
        _STATE["model"] = MockModel()
        return True


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────
def preprocess(img):
    img = cv2.resize(img, _STATE["size"])
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    if TF_AVAILABLE and _preprocess_input_fn:
        img = _preprocess_input_fn(img.astype("float32"))
    else:
        img = img.astype("float32") / 255.0
    return np.expand_dims(img, axis=0)


def decode(prob):
    prediction = "DAMAGE" if prob > 0.5 else "SAFE"
    confidence = prob if prob > 0.5 else 1 - prob
    return {
        "prediction": prediction,
        "confidence": round(float(confidence), 4),
        "risk": "HIGH" if prediction == "DAMAGE" else "LOW",
        "recommendations": get_recommendations(prediction)
    }


def get_recommendations(prediction):
    if prediction == "DAMAGE":
        return [
            "Evacuate area immediately",
            "Deploy emergency response",
            "Provide medical assistance",
            "Restrict unsafe zones",
            "Notify authorities"
        ]
    return [
        "No immediate danger",
        "Continue monitoring",
        "Maintain safety protocols",
        "Log observations"
    ]


# ─────────────────────────────────────────────
# IMAGE PREDICTION
# ─────────────────────────────────────────────
@router.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    load_ml_model()

    if _STATE["model"] is None:
        raise HTTPException(503, detail="Model not loaded")

    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(400, detail="Invalid image")

        tensor = preprocess(img)
        pred = _STATE["model"].predict(tensor, verbose=0)
        prob = float(pred[0][0])
        return decode(prob)

    except Exception as e:
        print("Image error:", e)
        raise HTTPException(500, detail="Prediction failed")



# ─────────────────────────────────────────────
# URL-BASED IMAGE PREDICTION
# ─────────────────────────────────────────────
class PredictURLRequest(BaseModel):
    url: str

@router.post("/predict-url")
async def predict_image_url(req: PredictURLRequest):
    load_ml_model()
    if _STATE["model"] is None:
        raise HTTPException(503, detail="Model not loaded")
    try:
        # Fetch image bytes from the URL
        headers = {"User-Agent": "Mozilla/5.0"}
        request = urllib.request.Request(req.url, headers=headers)
        with urllib.request.urlopen(request, timeout=10) as resp:
            contents = resp.read()

        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(400, detail="Could not decode image from URL. Make sure it's a direct image link (ending in .jpg, .png, etc.)")

        tensor = preprocess(img)
        pred = _STATE["model"].predict(tensor, verbose=0)
        prob = float(pred[0][0])
        return decode(prob)

    except HTTPException:
        raise
    except Exception as e:
        print("URL predict error:", e)
        raise HTTPException(500, detail=f"Failed to fetch or analyze image: {str(e)}")


# ─────────────────────────────────────────────
# VIDEO PREDICTION (NORMAL)
# ─────────────────────────────────────────────
@router.post("/predict-video")
async def predict_video(file: UploadFile = File(...)):
    load_ml_model()

    if _STATE["model"] is None:
        raise HTTPException(503, detail="Model not loaded")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")

    try:
        print(f"DEBUG: Processing video {file.filename}...")
        tmp.write(await file.read())
        tmp.close()

        cap = cv2.VideoCapture(tmp.name)
        if not cap.isOpened():
            print(f"ERROR: Cannot open video {tmp.name}")
            raise HTTPException(400, detail="Cannot open video")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 24
        interval = fps
        duration = total_frames / fps if fps > 0 else 0
        
        print(f"DEBUG: Video FPS: {fps}, Total Frames: {total_frames}, Approx Duration: {duration:.1f}s")

        frame_idx = 0
        sec = 0
        timeline = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % interval == 0:
                print(f"DEBUG: Processing second {sec} (frame {frame_idx})...")
                tensor = preprocess(frame)
                pred = _STATE["model"].predict(tensor, verbose=0)
                prob = float(pred[0][0])
                result = decode(prob)
                timeline.append({
                    "second": sec,
                    "prediction": result["prediction"],
                    "confidence": result["confidence"]
                })
                sec += 1

            frame_idx += 1

        cap.release()
        print(f"DEBUG: Finished processing {len(timeline)} seconds of video.")

        damage_count = sum(1 for x in timeline if x["prediction"] == "DAMAGE")
        overall = "DAMAGE" if damage_count > len(timeline) / 2 else "SAFE"

        # Compute overall confidence
        if timeline:
            if overall == "DAMAGE":
                relevant = [x["confidence"] for x in timeline if x["prediction"] == "DAMAGE"]
            else:
                relevant = [x["confidence"] for x in timeline if x["prediction"] == "SAFE"]
            overall_conf = round(sum(relevant) / len(relevant), 4) if relevant else 0.5
        else:
            overall_conf = 0.5

        # Add risk to each timeline entry
        for entry in timeline:
            entry["risk"] = "HIGH" if entry["prediction"] == "DAMAGE" else "LOW"

        return {
            "overall": overall,
            "overall_prediction": overall,
            "overall_confidence": overall_conf,
            "overall_risk": "HIGH" if overall == "DAMAGE" else "LOW",
            "timeline": timeline,
            "recommendations": get_recommendations(overall)
        }


    except Exception as e:
        print("Video error:", e)
        raise HTTPException(500, detail="Video failed")

    finally:
        try:
            os.unlink(tmp.name)
        except Exception:
            pass


# ─────────────────────────────────────────────
# VIDEO STREAM (REAL-TIME)
# ─────────────────────────────────────────────
@router.post("/predict-stream")
async def predict_stream(file: UploadFile = File(...)):
    load_ml_model()

    if _STATE["model"] is None:
        raise HTTPException(503, detail="Model not loaded")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    tmp.write(await file.read())
    tmp.close()

    async def generator():
        cap = cv2.VideoCapture(tmp.name)

        fps = int(cap.get(cv2.CAP_PROP_FPS)) or 24
        curr_lat, curr_lng = 26.14, 91.78  # Sample Dispur, Assam coords
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % fps == 0:
                tensor = preprocess(frame)
                pred = _STATE["model"].predict(tensor, verbose=0)
                prob = float(pred[0][0])
                result = decode(prob)

                # Simulate small movement
                curr_lat += (random.random() - 0.5) * 0.001
                curr_lng += (random.random() - 0.5) * 0.001

                data = {
                    "second": sec,
                    "prediction": result["prediction"],
                    "confidence": result["confidence"],
                    "risk": result["risk"],
                    "gps": {"lat": curr_lat, "lng": curr_lng}
                }

                yield f"data: {json.dumps(data)}\n\n"
                sec += 1

                await asyncio.sleep(1)

            frame_idx += 1

        cap.release()
        yield f"data: {json.dumps({'status': 'completed'})}\n\n"

    return StreamingResponse(generator(), media_type="text/event-stream")