import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Sequential
import sys

MODEL_OUT = "d:/MINOR/backend/disaster_model_resnet.keras"

print("Building dummy model for demo purposes...")
base = MobileNetV2(
    weights=None, # no need to download imagenet for a dummy
    include_top=False,
    input_shape=(224, 224, 3),
)

model = Sequential([
    base,
    GlobalAveragePooling2D(),
    BatchNormalization(),
    Dense(128, activation="relu"),
    Dropout(0.3),
    Dense(1, activation="sigmoid"),
])

model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
model.save(MODEL_OUT)
print(f"Dummy model saved to {MODEL_OUT}")
sys.exit(0)
