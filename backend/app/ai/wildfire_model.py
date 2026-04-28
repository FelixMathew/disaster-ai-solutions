import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

# temperature, humidity
X = np.array([
    [40, 20],
    [35, 25],
    [30, 50],
    [25, 60],
    [45, 15],
    [28, 55]
])

y = np.array([
    1, 1, 0, 0, 1, 0
])

model = RandomForestClassifier()
model.fit(X, y)

MODEL_PATH = "wildfire_model.pkl"

joblib.dump(model, MODEL_PATH)


def predict_wildfire(temperature, humidity):

    model = joblib.load(MODEL_PATH)

    prediction = model.predict([[temperature, humidity]])

    if prediction[0] == 1:
        return "High Wildfire Risk"
    else:
        return "Low Wildfire Risk"