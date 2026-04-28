from pymongo import MongoClient

# FORCE LOCAL CONNECTION (NO ENV, NO CONFUSION)
MONGO_URI = "mongodb://127.0.0.1:27017"

try:
    # Connect to MongoDB
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000
    )

    # Test connection
    client.admin.command('ping')
    print("[OK] Connected to LOCAL MongoDB successfully")

except Exception as e:
    print("[FAIL] MongoDB Connection Failed:", e)


# FORCE CORRECT DATABASE
db = client["disasterdb"]
print("[DB] Using Database:", db.name)

# FORCE CORRECT COLLECTION
users_collection = db["users"]
print("[DB] Using Collection:", users_collection.name)