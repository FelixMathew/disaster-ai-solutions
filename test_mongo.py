import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi

load_dotenv("D:/MINOR/backend/.env")
MONGO_URI = os.getenv("MONGO_URI")

try:
    print("Attempting to connect to MongoDB...")
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
