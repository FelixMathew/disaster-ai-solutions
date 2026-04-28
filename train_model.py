"""
train_model.py
==============
Train a MobileNetV2 binary classifier for disaster damage detection.

Usage:
    python train_model.py

Requirements:
    pip install tensorflow opencv-python

Dataset layout expected (created by prepare_dataset.py):
    dataset/
        train/
            SAFE/
            DAMAGE/
        test/
            SAFE/
            DAMAGE/

Output:
    disaster_model_resnet.keras
"""

import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout, BatchNormalization
from tensorflow.keras.models import Sequential
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
import numpy as np

# ─── Config ──────────────────────────────────────────────────────────────────
IMG_SIZE    = (224, 224)
BATCH_SIZE  = 32
EPOCHS      = 30
TRAIN_DIR   = "dataset/train"
TEST_DIR    = "dataset/test"
MODEL_OUT   = "backend/disaster_model_resnet.keras"

print("=" * 60)
print("  DisasterAI Model Trainer — MobileNetV2")
print("=" * 60)
print(f"  GPU available: {tf.config.list_physical_devices('GPU')}")

# ─── Data Generators ─────────────────────────────────────────────────────────
# NOTE: We use MobileNetV2's own preprocess_input (scales to [-1, 1]).
#       The backend MUST apply the same preprocessing.

train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=25,
    zoom_range=0.25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    shear_range=0.15,
    horizontal_flip=True,
    vertical_flip=False,
    brightness_range=[0.75, 1.25],
    fill_mode="reflect",
    validation_split=0.10,    # 10 % of train as in-train validation
)

test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

train_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    subset="training",
    shuffle=True,
    seed=42,
)

val_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    subset="validation",
    shuffle=False,
    seed=42,
)

test_gen = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=False,
)

print(f"\n  Class map: {train_gen.class_indices}")
print(f"  Train samples : {train_gen.samples}")
print(f"  Val   samples : {val_gen.samples}")
print(f"  Test  samples : {test_gen.samples}\n")

# ─── Model ───────────────────────────────────────────────────────────────────
base = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(*IMG_SIZE, 3),
)
base.trainable = False   # freeze base initially

model = Sequential([
    base,
    GlobalAveragePooling2D(),
    BatchNormalization(),
    Dense(256, activation="relu"),
    BatchNormalization(),
    Dropout(0.4),
    Dense(128, activation="relu"),
    Dropout(0.35),
    Dense(1, activation="sigmoid"),   # binary output
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss="binary_crossentropy",
    metrics=["accuracy"],
)

model.summary()

# ─── Callbacks ───────────────────────────────────────────────────────────────
callbacks = [
    EarlyStopping(
        monitor="val_accuracy",
        patience=4,
        restore_best_weights=True,
        verbose=1,
    ),
    ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=2,
        min_lr=1e-6,
        verbose=1,
    ),
    ModelCheckpoint(
        MODEL_OUT,
        monitor="val_accuracy",
        save_best_only=True,
        verbose=1,
    ),
]

# ─── Phase 1: Train head only ─────────────────────────────────────────────────
print("\n[PHASE 1] Training classifier head (base frozen)…")
history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS,
    steps_per_epoch=len(train_gen),
    validation_steps=len(val_gen),
    callbacks=callbacks,
)

# ─── Phase 2: Fine-tune top 30 layers of base ────────────────────────────────
print("\n[PHASE 2] Fine-tuning top 50 layers of MobileNetV2…")
base.trainable = True
for layer in base.layers[:-50]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss="binary_crossentropy",
    metrics=["accuracy"],
)

history2 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS,
    steps_per_epoch=len(train_gen),
    validation_steps=len(val_gen),
    callbacks=callbacks,
)

# ─── Evaluate ─────────────────────────────────────────────────────────────────
print("\n[EVAL] Evaluating on test set…")
loss, acc = model.evaluate(test_gen, verbose=1)
print(f"\n  Test Loss     : {loss:.4f}")
print(f"  Test Accuracy : {acc:.4f}  ({acc * 100:.1f} %)")

# ─── Save final model ────────────────────────────────────────────────────────
model.save(MODEL_OUT)
print(f"\n✅  Model saved → {MODEL_OUT}")
print("   Class mapping:")
for cls, idx in train_gen.class_indices.items():
    print(f"     index {idx} → {cls}")
print("\nDone! Remember: DAMAGE = prob > 0.5 | SAFE = prob <= 0.5")
