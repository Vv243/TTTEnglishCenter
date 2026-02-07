from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class TeacherBase(BaseModel):
    """Base teacher schema with common fields"""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    zalo_id: Optional[str] = Field(None, max_length=50)
    whatsapp_number: Optional[str] = Field(None, max_length=20)
    role: str = Field(default='teacher', pattern='^(admin|teacher|assistant)$')
    is_active: bool = True
    bio: Optional[str] = None
    specializations: Optional[List[str]] = []

class TeacherCreate(TeacherBase):
    """Schema for creating a new teacher"""
    password: str = Field(..., min_length=8, max_length=100)

class TeacherUpdate(BaseModel):
    """Schema for updating a teacher (all fields optional)"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    zalo_id: Optional[str] = Field(None, max_length=50)
    whatsapp_number: Optional[str] = Field(None, max_length=20)
    role: Optional[str] = Field(None, pattern='^(admin|teacher|assistant)$')
    is_active: Optional[bool] = None
    bio: Optional[str] = None
    specializations: Optional[List[str]] = None

class Teacher(TeacherBase):
    """Schema for teacher responses (includes id and timestamps)"""
    id: UUID
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # Allows SQLAlchemy models to be converted

class TeacherList(BaseModel):
    """Schema for paginated teacher list"""
    teachers: List[Teacher]
    total: int
    page: int
    page_size: int