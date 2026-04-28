import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Example training data
X = np.array([
    [200, 8],
    [300, 9],
    [50, 3],
    [80, 4],
    [400, 10],
    [120, 5]
])

y = np.array([
    1,
    1,
    0,
    0,
    1,
    0
])

model = RandomForestClassifier()
model.fit(X, y)

MODEL_PATH = "flood_model.pkl"

# Save model
joblib.dump(model, MODEL_PATH)

# ✅ LOAD ONCE (IMPORTANT)
loaded_model = joblib.load(MODEL_PATH)


def predict_flood(rainfall, river_level):
    prediction = loaded_model.predict([[rainfall, river_level]])

    if prediction[0] == 1:
        return "High Flood Risk"
    else:
        return "Low Flood Risk"