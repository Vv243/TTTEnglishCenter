from pydantic import BaseModel
from enum import Enum
from typing import Optional
import uuid

class UserRole(str, Enum):
    admin = "admin"
    teacher = "teacher"

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole = UserRole.teacher
    full_name: Optional[str] = None

class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    role: UserRole
    full_name: Optional[str]
    is_active: bool
    teacher_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
