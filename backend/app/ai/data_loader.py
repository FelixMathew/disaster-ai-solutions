import os
import json
import cv2
import numpy as np

# 👉 IMPORTANT: your dataset path
DATASET_PATH = "D:/MINOR/XBD_DATASET/train"

# 👉 Map damage labels to numbers
damage_map = {
    "no-damage": 0,
    "minor-damage": 1,
    "major-damage": 2,
    "destroyed": 3
}

def load_dataset():

    images = []
    labels = []

    images_path = os.path.join(DATASET_PATH, "images")
    labels_path = os.path.join(DATASET_PATH, "labels")

    for file in os.listdir(images_path):

        # 👉 only post-disaster images
        if file.endswith("_post_disaster.png"):

            img_path = os.path.join(images_path, file)

            # ✅ Load image
            img = cv2.imread(img_path)

            if img is None:
                continue

            # ✅ Resize
            img = cv2.resize(img, (224, 224))

            # ✅ Normalize (VERY IMPORTANT)
            

            # 👉 corresponding JSON
            json_file = file.replace("_post_disaster.png", "_post_disaster.json")
            json_path = os.path.join(labels_path, json_file)

            damage_levels = []

            if os.path.exists(json_path):
                with open(json_path) as f:
                    data = json.load(f)

                    if "features" in data and "xy" in data["features"]:
                        for obj in data["features"]["xy"]:
                            subtype = obj["properties"].get("subtype", "no-damage")
                            damage_levels.append(damage_map.get(subtype, 0))

            # ✅ Take highest damage level in image
            damage = max(damage_levels) if damage_levels else 0

            images.append(img)
            labels.append(damage)

    # ✅ Convert to numpy arrays
    images = np.array(images, dtype=np.float32)
    labels = np.array(labels, dtype=np.int32)

    return images, labels