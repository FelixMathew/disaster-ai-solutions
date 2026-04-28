import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
import numpy as np
import cv2
from pathlib import Path
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras import layers, models, callbacks
from random import shuffle, seed as rseed
from sklearn.utils.class_weight import compute_class_weight

DATASET_DIR = Path("D:/MINOR/XBD_DATASET/train")
IMAGES_DIR = DATASET_DIR / "images"
TARGETS_DIR = DATASET_DIR / "targets"
OUTPUT_MODEL_H5 = Path("D:/MINOR/backend/disaster_model_stable.h5")
OUTPUT_MODEL_KERAS = Path("D:/MINOR/backend/disaster_model_fixed.keras")

IMG_SIZE = (128, 128)
BATCH_SIZE = 32
EPOCHS = 8
MAX_SAMPLES = 800

def get_label_from_target(target_path):
    mask = cv2.imread(str(target_path))
    if mask is None: return 0
    non_black = np.any(mask > 30, axis=2)
    if non_black.sum() == 0: return 0
    bldg_pixels = mask[non_black]
    r = bldg_pixels[:, 2].mean()
    g = bldg_pixels[:, 1].mean()
    if r > g + 40:
        if r > 200: return 3
        return 2
    elif g > r + 20: return 0
    elif r > g - 10: return 1
    return 0

images_list, labels_list = [], []
all_post = list(IMAGES_DIR.glob("*_post_disaster.png"))
rseed(42)
shuffle(all_post)

class_counts = {0: 0, 1: 0, 2: 0, 3: 0}

for img_path in all_post:
    target_path = TARGETS_DIR / (img_path.stem + "_target.png")
    label = get_label_from_target(target_path) if target_path.exists() else 0
    if class_counts[label] >= MAX_SAMPLES: continue
    
    img = cv2.imread(str(img_path))
    if img is None: continue
    
    img = cv2.resize(img, IMG_SIZE)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # PROPER MOBILENETV2 SCALING [-1, 1]
    img = preprocess_input(img.astype("float32")) 
    
    images_list.append(img)
    labels_list.append(label)
    class_counts[label] += 1

print("Class distribution:", class_counts)

X = np.array(images_list, dtype="float32")
y = np.array(labels_list)
idx = np.arange(len(X))
np.random.shuffle(idx)
X, y = X[idx], y[idx]

# Split 85/15
split = int(0.85 * len(X))
X_train, X_val = X[:split], X[split:]
y_train, y_val = y[:split], y[split:]

y_train_cat = tf.keras.utils.to_categorical(y_train, 4)
y_val_cat = tf.keras.utils.to_categorical(y_val, 4)

# Calculate strong class weights to fix 'No Damage' bias
weights = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
class_weight_dict = {i: w for i, w in enumerate(weights)}
print("Class weights:", class_weight_dict)

base = MobileNetV2(input_shape=(128, 128, 3), include_top=False, weights="imagenet", pooling="avg")
base.trainable = False

inputs = tf.keras.Input(shape=(128, 128, 3))
x = base(inputs, training=False)
x = layers.Dropout(0.3)(x)
x = layers.Dense(64, activation="relu")(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(4, activation="softmax")(x)

model = models.Model(inputs, outputs)
model.compile(optimizer=tf.keras.optimizers.Adam(1e-3), loss="categorical_crossentropy", metrics=["accuracy"])

print("Training starts...")
model.fit(X_train, y_train_cat, validation_data=(X_val, y_val_cat), epochs=EPOCHS, batch_size=BATCH_SIZE, class_weight=class_weight_dict)

model.save(str(OUTPUT_MODEL_H5))
model.save(str(OUTPUT_MODEL_KERAS))
print(f"Saved to {OUTPUT_MODEL_H5} and {OUTPUT_MODEL_KERAS}")
