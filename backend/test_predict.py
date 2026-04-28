import os
import sys

# Change working directory so it acts like we started the backend
os.chdir("d:/MINOR/backend")
sys.path.insert(0, os.getcwd())

import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

print("\n🚀 Starting DisasterAI Backend Test Client...")

# Create a realistic test image (reddish for "FIRE/DAMAGE" simulation, but it's a dummy model so output is random)
test_img = np.zeros((500, 500, 3), dtype=np.uint8)
test_img[:] = (0, 0, 200) # BGR red
cv2.imwrite("test_dummy.jpg", test_img)

client = TestClient(app)

print("📸 Sending test_dummy.jpg to /predict endpoint...")

with open("test_dummy.jpg", "rb") as f:
    response = client.post("/predict", files={"file": ("test_dummy.jpg", f, "image/jpeg")})

print(f"\n✅ Server Response Code: {response.status_code}")
import json
print("📊 JSON Response:")
print(json.dumps(response.json(), indent=2))

# Cleanup
if os.path.exists("test_dummy.jpg"):
    os.remove("test_dummy.jpg")
