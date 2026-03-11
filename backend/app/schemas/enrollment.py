from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal


class EnrollmentBase(BaseModel):
    """Base enrollment schema"""
    student_id: UUID
    class_id: UUID

    # Enrollment details
    enrollment_date: date = Field(default_factory=date.today)
    status: str = Field(default='active', pattern='^(active|dropped|completed|suspended|waitlisted|scheduled)$')

    # Waitlist
    waitlist_position: Optional[int] = Field(None, gt=0)

    # Payment agreement
    agreed_tuition_per_session: Decimal = Field(..., gt=0, decimal_places=2)
    discount_percent: Decimal = Field(default=0, ge=0, le=100, decimal_places=2)
    discount_reason: Optional[str] = None


class EnrollmentCreate(EnrollmentBase):
    """Schema for creating a new enrollment"""
    pass


class EnrollmentUpdate(BaseModel):
    """Schema for updating an enrollment"""
    status: Optional[str] = None
    waitlist_position: Optional[int] = None
    agreed_tuition_per_session: Optional[Decimal] = Field(None, gt=0)
    discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_reason: Optional[str] = None
    drop_reason: Optional[str] = None
    # Academic progress updates
    attendance_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    average_score: Optional[Decimal] = Field(None, ge=0, le=100)
    last_test_score: Optional[Decimal] = Field(None, ge=0, le=100)
    progress_trend: Optional[str] = Field(None, pattern='^(improving|stable|declining|insufficient_data)$')


class StudentNested(BaseModel):
    id: UUID
    full_name: str
    grade_level: Optional[str] = None

    class Config:
        from_attributes = True


class ClassNested(BaseModel):
    id: UUID
    class_name: str
    class_code: str
    level: str

    class Config:
        from_attributes = True


class Enrollment(EnrollmentBase):
    """Schema for enrollment responses"""
    id: UUID
    drop_date: Optional[date] = None
    drop_reason: Optional[str] = None
    # Academic progress
    attendance_rate: Decimal
    average_score: Optional[Decimal] = None
    last_test_score: Optional[Decimal] = None
    last_test_date: Optional[date] = None
    progress_trend: Optional[str] = None
    predicted_final_score: Optional[Decimal] = None
    prediction_confidence: Optional[Decimal] = None
    prediction_updated_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    # Nested relationships
    student: Optional[StudentNested] = None
    class_: Optional[ClassNested] = Field(None, alias="class")

    class Config:
        from_attributes = True
        populate_by_name = True


class EnrollmentList(BaseModel):
    """Schema for paginated enrollment list"""
    enrollments: List[Enrollment]
    total: int
    page: int
    page_size: int