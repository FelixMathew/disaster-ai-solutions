from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.database import users_collection
from app.models.user_model import UserRegister
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_admin_user,
)
from app.services.telegram_service import send_telegram_alert
from app.services.email_service import send_email_alert
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


# ==========================
# REGISTER
# ==========================
@router.post("/register")
def register(user: UserRegister):
    print(f"--- Registration Attempt ---")
    print(f"Email: {user.email}")
    print(f"Username: {user.username}")

    try:
        print("Checking if user already exists in MongoDB...")
        existing_user = users_collection.find_one({"email": user.email})
        print("MongoDB check complete.")
    except Exception as e:
        print(f"Error querying MongoDB during registration: {e}")
        raise HTTPException(status_code=500, detail="Database connection error while checking user")

    if existing_user:
        print("Registration failed: Email already registered")
        raise HTTPException(status_code=400, detail="Email already registered")

    print("Hashing password...")
    hashed_password = hash_password(user.password)

    # Build the document to insert, include optional fields when provided
    user_data = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "role": user.role if user.role else "user",
        "created_at": datetime.utcnow(),
        "is_active": True,
    }

    if getattr(user, "full_name", None):
        user_data["full_name"] = user.full_name
    # Phone is now mandatory — always store it
    if getattr(user, "phone", None):
        user_data["phone"] = user.phone
    if getattr(user, "address", None):
        user_data["address"] = user.address
    if getattr(user, "metadata", None):
        user_data["metadata"] = user.metadata

    try:
        print(f"Inserting new user `{user.email}` into MongoDB...")
        users_collection.insert_one(user_data)
        print("MongoDB insertion successful.")
    except Exception as e:
        print(f"Error inserting user into MongoDB: {e}")
        raise HTTPException(status_code=500, detail="Database insertion error")

    print("--- Registration Successful ---")
    # Auto-login: return access token so frontend can redirect to dashboard
    access_token = create_access_token({
        "sub": user.email,
        "role": user_data["role"]
    })
    return {"message": "User registered successfully", "access_token": access_token, "token_type": "bearer"}


# ==========================
# LOGIN
# ==========================
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):

    # username field contains email from frontend
    db_user = users_collection.find_one({"email": form_data.username})

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(form_data.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token({
        "sub": db_user["email"],
        "role": db_user["role"]
    })

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ==========================
# PROFILE (Protected)
# ==========================
@router.get("/profile")
def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "username": current_user.get("username", ""),
        "email": current_user.get("email", ""),
        "role": current_user.get("role", "user"),
        "phone": current_user.get("phone", ""),
        "avatar": current_user.get("avatar", ""),
    }


# ==========================
# CHANGE PASSWORD
# ==========================
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    if not verify_password(req.current_password, current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    new_hash = hash_password(req.new_password)
    users_collection.update_one(
        {"email": current_user["email"]},
        {"$set": {"password": new_hash}}
    )
    return {"message": "Password updated successfully"}


# ==========================
# UPDATE PROFILE
# ==========================
class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None

@router.put("/profile")
def update_profile(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    updates = {}
    if req.username:
        updates["username"] = req.username
    if req.phone is not None:
        updates["phone"] = req.phone
    if req.avatar is not None:
        updates["avatar"] = req.avatar

    if updates:
        users_collection.update_one(
            {"email": current_user["email"]},
            {"$set": updates}
        )
    return {"message": "Profile updated successfully"}


# ==========================
# SEND ALERT TO ALL USERS
# ==========================
class SendAlertRequest(BaseModel):
    disaster_type: str
    location: str
    risk_level: str
    message: Optional[str] = None

@router.post("/send-alert")
def send_alert_to_users(req: SendAlertRequest):
    from app.database import db
    from datetime import datetime, timezone
    alerts_collection = db["alerts"]

    alert_text = req.message or f"Stay alert and move to safe areas."

    telegram_msg = f"""⚠️ DisasterAI ALERT

Disaster: {req.disaster_type}
Location: {req.location}
Risk Level: {req.risk_level.upper()}

{alert_text}"""

    email_subject = f"⚠️ DisasterAI Alert — {req.disaster_type} in {req.location}"
    email_body = telegram_msg

    # Persist alert to DB with timestamp for analytics/notifications
    now = datetime.now(timezone.utc).isoformat()
    try:
        alerts_collection.insert_one({
            "type": req.disaster_type,
            "location": req.location,
            "risk": req.risk_level.capitalize(),
            "title": f"{req.disaster_type} alert — {req.location}",
            "description": alert_text,
            "timestamp": now,
        })
    except Exception as e:
        print(f"Alert DB insert error: {e}")

    # Send to Telegram channel
    try:
        send_telegram_alert(telegram_msg)
    except Exception as e:
        print(f"Telegram error: {e}")

    # Send to all registered users' emails
    try:
        from app.services.email_service import send_email_bulk
        all_users = list(users_collection.find({}, {"email": 1, "_id": 0}))
        email_list = [u["email"] for u in all_users if "email" in u]
        sent_count = send_email_bulk(email_subject, email_body, email_list)
    except Exception as e:
        print(f"DB error during bulk email: {e}")

    return {
        "status": "success",
        "telegram_sent": True,
        "emails_sent": sent_count,
        "message": f"Alert sent to {sent_count} users"
    }


# ==========================
# ADMIN ONLY
# ==========================
@router.get("/admin-dashboard")
def admin_dashboard(admin: dict = Depends(get_admin_user)):
    return {
        "message": "Welcome Admin 🔥",
        "admin_email": admin["email"]
    }


# ==========================
# FORGOT PASSWORD — Send OTP
# ==========================
import random
import time

# In-memory OTP store: { email: { otp: str, expires: float } }
_otp_store: dict = {}

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    user = users_collection.find_one({"email": req.email})
    if not user:
        # Always return success to prevent email enumeration
        return {"message": "If that email exists, a reset code has been sent."}

    otp = str(random.randint(100000, 999999))
    _otp_store[req.email] = {
        "otp": otp,
        "expires": time.time() + 600  # 10 minutes
    }

    subject = "🔐 DisasterAI — Password Reset Code"
    body = f"""Hello {user.get('username', 'User')},

Your DisasterAI password reset code is:

  {otp}

This code expires in 10 minutes. If you did not request this, please ignore this email.

— The DisasterAI Team"""

    send_email_alert(subject, body, req.email)
    return {"message": "If that email exists, a reset code has been sent."}


# ==========================
# RESET PASSWORD — Verify OTP
# ==========================
class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    entry = _otp_store.get(req.email)
    if not entry:
        raise HTTPException(status_code=400, detail="No reset code found. Please request a new one.")

    if time.time() > entry["expires"]:
        _otp_store.pop(req.email, None)
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    if entry["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid reset code. Please try again.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    new_hash = hash_password(req.new_password)
    users_collection.update_one(
        {"email": req.email},
        {"$set": {"password": new_hash}}
    )

    # Clean up OTP
    _otp_store.pop(req.email, None)
    return {"message": "Password reset successfully. You can now log in."}