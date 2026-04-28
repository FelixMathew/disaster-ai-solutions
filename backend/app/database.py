import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Use MONGO_URI from environment (Railway sets this) — fallback to local dev
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")

try:
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=8000,
        tls=True if "mongodb+srv" in MONGO_URI else False,
    )
    client.admin.command('ping')
    print("[OK] Connected to MongoDB successfully:", MONGO_URI[:40], "...")

except Exception as e:
    print("[FAIL] MongoDB Connection Failed:", e)
    raise


# Database and collections
db = client["disasterdb"]
print("[DB] Using Database:", db.name)

users_collection = db["users"]
print("[DB] Using Collection:", users_collection.name)