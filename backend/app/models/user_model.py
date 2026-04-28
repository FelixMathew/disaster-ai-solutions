from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone: str  # Required — mandatory for emergency alerts
    role: str = "user"
    full_name: Optional[str] = None
    address: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str