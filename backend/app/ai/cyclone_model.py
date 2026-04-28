import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Expanded synthetic dataset for professional-grade prediction
# Features: [wind_speed (km/h), pressure (hPa), humidity (%), sea_surface_temp (C), visibility (km)]
# Labels (Levels): 0 (None), 1 (Tropical Depression), 2 (Tropical Storm), 3 (Category 1), 4 (Category 2), 5 (Category 3+)

X = np.array([
    # Low Risk / No Cyclone
    [40, 1010, 60, 25, 15],
    [50, 1008, 65, 26, 12],
    [60, 1005, 70, 26.5, 10],
    
    # Level 1 - Tropical Depression
    [70, 1000, 75, 27, 8],
    [80, 995, 80, 27.5, 6],
    
    # Level 2 - Tropical Storm
    [100, 990, 85, 28, 5],
    [110, 985, 88, 28.5, 4],
    
    # Level 3 - Category 1
    [130, 980, 90, 29, 3],
    [145, 975, 92, 29.5, 2],
    
    # Level 4 - Category 2
    [160, 970, 94, 30, 1.5],
    [175, 965, 96, 30.5, 1],
    
    # Level 5 - Category 3+
    [200, 950, 98, 31, 0.5],
    [250, 930, 99, 32, 0.2]
])

y = np.array([0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5])

# Train a more robust Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "cyclone_model.pkl")
joblib.dump(model, MODEL_PATH)

def predict_cyclone(wind_speed, pressure, humidity=80, sst=28, visibility=5):
    """
    Predicts cyclone risk level based on environmental factors.
    Returns a dict with level, confidence, and descriptive analysis.
    """
    if not os.path.exists(MODEL_PATH):
        joblib.dump(model, MODEL_PATH)
        
    loaded_model = joblib.load(MODEL_PATH)
    features = [[wind_speed, pressure, humidity, sst, visibility]]
    
    level = int(loaded_model.predict(features)[0])
    probabilities = loaded_model.predict_proba(features)[0]
    confidence = float(np.max(probabilities))
    
    levels = {
        0: "No Immediate Threat",
        1: "Level 1: Tropical Depression (Alert)",
        2: "Level 2: Tropical Storm (Warning)",
        3: "Level 3: Category 1 Cyclone (Critical)",
        4: "Level 4: Category 2 Cyclone (Severe)",
        5: "Level 5: Category 3+ Major Cyclone (Extreme)"
    }
    
    return {
        "level": level,
        "prediction": levels.get(level, "Unknown"),
        "confidence": round(confidence * 100, 2),
        "risk": "HIGH" if level >= 3 else ("MEDIUM" if level >= 1 else "LOW")
    }