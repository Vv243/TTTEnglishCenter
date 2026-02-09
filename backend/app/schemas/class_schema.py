from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time
from uuid import UUID
from decimal import Decimal

class ClassBase(BaseModel):
    """Base class schema"""
    class_code: str = Field(..., min_length=3, max_length=20)
    class_name: str = Field(..., min_length=3, max_length=100)
    
    # Teacher assignment
    teacher_id: UUID
    assistant_teacher_id: Optional[UUID] = None
    
    # Schedule
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    start_time: time
    end_time: time
    
    # Location
    room_number: Optional[str] = Field(None, max_length=20)
    building: Optional[str] = Field(None, max_length=50)
    
    # Academic details - supports all 3 categories
    # Category 1: primary_1-5, secondary_6-9, high_10-12
    # Category 2: starters, movers, flyers, ket, pet, fce, ielts, toefl, sat
    # Category 3: general_english
    level: str = Field(..., pattern='^(primary_[1-5]|secondary_[6-9]|high_1[0-2]|starters|movers|flyers|ket|pet|fce|ielts|toefl|sat|general_english)$')
    
    curriculum: Optional[str] = Field(None, max_length=50)
    textbook: Optional[str] = Field(None, max_length=100)
    
    # Capacity
    max_students: int = Field(default=15, ge=1, le=30)
    
    # Semester
    semester: str = Field(..., max_length=20)
    start_date: date
    end_date: date
    total_sessions: int = Field(..., gt=0)
    sessions_per_month: int = Field(default=4, ge=1, le=20)
    
    # Pricing
    tuition_per_session: Decimal = Field(..., gt=0, decimal_places=2)
    currency: str = Field(default='VND', max_length=3)
    
    # Status
    status: str = Field(default='scheduled', pattern='^(scheduled|active|completed|cancelled)$')
    
    description: Optional[str] = None
    prerequisites: Optional[str] = None
    learning_objectives: Optional[str] = None

class ClassCreate(ClassBase):
    """Schema for creating a new class"""
    pass

class ClassUpdate(BaseModel):
    """Schema for updating a class (all fields optional)"""
    class_code: Optional[str] = None
    class_name: Optional[str] = None
    teacher_id: Optional[UUID] = None
    assistant_teacher_id: Optional[UUID] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room_number: Optional[str] = None
    building: Optional[str] = None
    level: Optional[str] = None
    curriculum: Optional[str] = None
    textbook: Optional[str] = None
    max_students: Optional[int] = Field(None, ge=1, le=30)
    semester: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_sessions: Optional[int] = Field(None, gt=0)
    sessions_per_month: Optional[int] = Field(None, ge=1, le=20)
    tuition_per_session: Optional[Decimal] = Field(None, gt=0)
    status: Optional[str] = None
    description: Optional[str] = None
    prerequisites: Optional[str] = None
    learning_objectives: Optional[str] = None

class Class(ClassBase):
    """Schema for class responses"""
    id: UUID
    current_enrollment: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ClassList(BaseModel):
    """Schema for paginated class list"""
    classes: List[Class]
    total: int
    page: int
    page_size: int