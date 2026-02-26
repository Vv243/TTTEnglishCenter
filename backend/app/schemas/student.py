from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID

class StudentBase(BaseModel):
    """Base student schema"""
    full_name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: date
    
    # Student's current school grade
    grade_level: str = Field(..., pattern='^(primary_[1-5]|secondary_[6-9]|high_1[0-2]|adult)$')
    
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    
    # Parent contact (required - parents pay tuition in Vietnam)
    parent_name: str = Field(..., min_length=2, max_length=100)
    parent_phone: str = Field(..., min_length=10, max_length=20)
    parent_email: Optional[EmailStr] = None
    parent_zalo: Optional[str] = Field(None, max_length=50)
    secondary_contact_name: Optional[str] = Field(None, max_length=100)
    secondary_contact_phone: Optional[str] = Field(None, max_length=20)
    
    # Address (Vietnam 2-tier system post-July 2025)
    street_address: Optional[str] = None
    ward: Optional[str] = Field(None, max_length=100)
    province_city: Optional[str] = Field(default='TP. Hồ Chí Minh', max_length=100)
    
    # Academic info
    english_level: Optional[str] = Field(None, pattern='^(beginner|elementary|pre_intermediate|intermediate|upper_intermediate|advanced)$')
    
    # What exam/goal they're preparing for (optional)
    target_exam: Optional[str] = Field(None, pattern='^(school_exam|starters|movers|flyers|ket|pet|fce|ielts|toefl|sat|general_english|none)$')
    
    current_school_name: Optional[str] = Field(None, max_length=200)
    current_school_type: Optional[str] = Field(None, pattern='^(public|private|international|unknown)$')
    
    # Status
    is_active: bool = True
    notes: Optional[str] = None
    medical_notes: Optional[str] = None

class StudentCreate(StudentBase):
    """Schema for creating a new student"""
    pass

class StudentUpdate(BaseModel):
    """Schema for updating a student (all fields optional)"""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    date_of_birth: Optional[date] = None
    grade_level: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    parent_zalo: Optional[str] = None
    street_address: Optional[str] = None
    ward: Optional[str] = None
    province_city: Optional[str] = None
    english_level: Optional[str] = None
    target_exam: Optional[str] = None
    current_school_name: Optional[str] = None
    current_school_type: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    medical_notes: Optional[str] = None

class Student(StudentBase):
    """Schema for student responses"""
    id: UUID
    payment_cluster: str
    enrollment_date: date
    withdrawal_date: Optional[date] = None
    withdrawal_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class StudentList(BaseModel):
    """Schema for paginated student list"""
    students: List[Student]
    total: int
    page: int
    page_size: int