import traceback
from tensorflow.keras.models import load_model

try:
    load_model('d:/MINOR/backend/disaster_model_resnet.keras', compile=False)
except Exception as e:
    print("\n---ERROR START---")
    print(type(e).__name__)
    print(str(e)[:500])
    print("---ERROR END---")