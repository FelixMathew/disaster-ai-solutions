"""
DisasterAI - Fast MobileNetV2 Model Trainer
Uses XBD Dataset: pre_disaster images (label 0=No Damage) 
and post_disaster images labeled by target mask pixel analysis.

Labels:
  0 = No Damage
  1 = Minor Damage  
  2 = Major Damage
  3 = Destroyed

Run from backend directory:
  python scripts/train_disaster_model.py
"""

import os
import sys
import numpy as np
import cv2
from pathlib import Path

# Suppress TF logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras import layers, models, callbacks

# ========================
# CONFIGURATION
# ========================
DATASET_DIR = Path("D:/MINOR/XBD_DATASET/train")
IMAGES_DIR = DATASET_DIR / "images"
TARGETS_DIR = DATASET_DIR / "targets"
OUTPUT_MODEL = Path("D:/MINOR/backend/disaster_model_fixed.keras")

IMG_SIZE = (128, 128)   # small for speed
BATCH_SIZE = 32
EPOCHS = 8
MAX_SAMPLES_PER_CLASS = 600  # cap to keep training fast

print("[INFO] TF version:", tf.__version__)
print("[INFO] Scanning dataset...")

# ========================
# LABEL EXTRACTION
# ========================
def get_label_from_target(target_path):
    """Read a target PNG mask and determine damage class from pixel colours.
    XBD target PNGs: 
      - Background (no building) is black (0,0,0)
      - Buildings have colour-coded pixels:
        green-ish  => no damage
        yellow-ish => minor damage
        orange-ish => major damage
        red-ish    => destroyed
    We use the R channel dominance to classify.
    """
    mask = cv2.imread(str(target_path))
    if mask is None:
        return 0

    # Count non-black pixels -> building pixels
    non_black = np.any(mask > 30, axis=2)
    if non_black.sum() == 0:
        return 0  # no buildings = no damage

    # Get the building pixels
    bldg_pixels = mask[non_black]  # shape (N, 3) BGR
    r = bldg_pixels[:, 2].mean()  # red channel
    g = bldg_pixels[:, 1].mean()  # green channel
    b = bldg_pixels[:, 0].mean()  # blue channel

    # Classify by dominant channel heuristic
    if r > g + 40:
        # red dominant => destroyed or major
        if r > 200:
            return 3  # Destroyed
        return 2  # Major Damage
    elif g > r + 20:
        return 0  # No Damage (green)
    elif r > g - 10 and r < g + 40:
        return 1  # Minor Damage (yellow = R+G)
    else:
        return 0  # No Damage

# ========================
# BUILD DATASET
# ========================
images_list = []
labels_list = []

all_imgs = list(IMAGES_DIR.glob("*_post_disaster.png"))
from random import shuffle, seed as rseed
rseed(42)
shuffle(all_imgs)

class_counts = {0: 0, 1: 0, 2: 0, 3: 0}

print(f"[INFO] Found {len(all_imgs)} post-disaster images")

for img_path in all_imgs:
    stem = img_path.stem  # e.g. hurricane-harvey_00000001_post_disaster
    target_name = stem + "_target.png"
    target_path = TARGETS_DIR / target_name

    label = get_label_from_target(target_path) if target_path.exists() else 0

    if class_counts[label] >= MAX_SAMPLES_PER_CLASS:
        continue

    img = cv2.imread(str(img_path))
    if img is None:
        continue

    img = cv2.resize(img, IMG_SIZE)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    images_list.append(img)
    labels_list.append(label)
    class_counts[label] += 1

# Also add pre-disaster images as class 0 (No Damage)
pre_imgs = list(IMAGES_DIR.glob("*_pre_disaster.png"))
shuffle(pre_imgs)
for img_path in pre_imgs:
    if class_counts[0] >= MAX_SAMPLES_PER_CLASS:
        break
    img = cv2.imread(str(img_path))
    if img is None:
        continue
    img = cv2.resize(img, IMG_SIZE)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    images_list.append(img)
    labels_list.append(0)
    class_counts[0] += 1

print("[INFO] Class distribution:", class_counts)
print(f"[INFO] Total samples: {len(images_list)}")

X = np.array(images_list, dtype="float32") / 255.0
y = np.array(labels_list)

# Shuffle together
idx = np.arange(len(X))
np.random.shuffle(idx)
X, y = X[idx], y[idx]

# Train/val split
split = int(0.85 * len(X))
X_train, X_val = X[:split], X[split:]
y_train, y_val = y[:split], y[split:]

y_train_cat = tf.keras.utils.to_categorical(y_train, 4)
y_val_cat = tf.keras.utils.to_categorical(y_val, 4)

print(f"[INFO] Train: {len(X_train)}, Val: {len(X_val)}")

# ========================
# BUILD MODEL
# ========================
base = MobileNetV2(
    input_shape=(128, 128, 3),
    include_top=False,
    weights="imagenet",
    pooling="avg"
)
base.trainable = False

inputs = tf.keras.Input(shape=(128, 128, 3))
x = base(inputs, training=False)
x = layers.Dropout(0.3)(x)
x = layers.Dense(128, activation="relu")(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(4, activation="softmax")(x)

model = models.Model(inputs, outputs)
model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)
model.summary()

# ========================
# TRAIN
# ========================
cb = [
    callbacks.EarlyStopping(patience=3, restore_best_weights=True),
    callbacks.ReduceLROnPlateau(patience=2, factor=0.5)
]

history = model.fit(
    X_train, y_train_cat,
    validation_data=(X_val, y_val_cat),
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    callbacks=cb
)

# ========================
# SAVE MODEL
# ========================
model.save(str(OUTPUT_MODEL))
print(f"[SUCCESS] Model saved to: {OUTPUT_MODEL}")

# Quick sanity check
test_img = np.random.rand(1, 128, 128, 3).astype("float32")
pred = model.predict(test_img)
print("[SANITY] Test prediction:", pred)
print("[DONE]")
