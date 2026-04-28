import numpy as np
from sklearn.linear_model import LogisticRegression
import joblib

# seismic activity, fault distance
X = np.array([
    [7.2, 10],
    [6.5, 20],
    [4.5, 80],
    [5.0, 60],
    [7.8, 5],
    [4.8, 70]
])

y = np.array([
    1, 1, 0, 0, 1, 0
])

model = LogisticRegression()
model.fit(X, y)

MODEL_PATH = "earthquake_model.pkl"

joblib.dump(model, MODEL_PATH)


def predict_earthquake(seismic_activity, fault_distance):

    model = joblib.load(MODEL_PATH)

    prediction = model.predict([[seismic_activity, fault_distance]])

    if prediction[0] == 1:
        return "High Earthquake Risk"
    else:
        return "Low Earthquake Risk"