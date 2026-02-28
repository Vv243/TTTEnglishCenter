from sqlalchemy import Column, String, Date, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin

class Student(Base, TimestampMixin):
    __tablename__ = "students"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Student Identity
    full_name = Column(String(100), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    grade_level = Column(String(20), nullable=False)
    
    # Contact
    phone = Column(String(20))
    email = Column(String(255))
    
    # Parent/Guardian Contact
    parent_name = Column(String(100), nullable=False)
    parent_phone = Column(String(20), nullable=False, index=True)
    parent_email = Column(String(255))
    parent_zalo = Column(String(50))
    secondary_contact_name = Column(String(100))
    secondary_contact_phone = Column(String(20))
    
    # Address (Vietnam 2-tier system post-July 2025)
    street_address = Column(String)
    ward = Column(String(100))
    province_city = Column(String(100), default='TP. Hồ Chí Minh')
    
    # Academic Info
    english_level = Column(String(20))
    target_exam = Column(String(50))
    current_school_name = Column(String(200))
    current_school_type = Column(String(20))
    
    # Payment Behavior (ML)
    payment_cluster = Column(String(20), default='new_student', index=True)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    enrollment_date = Column(Date, nullable=False)
    withdrawal_date = Column(Date)
    withdrawal_reason = Column(String)
    
    # Notes
    notes = Column(String)
    medical_notes = Column(String)
    
    # Relationships
    enrollments = relationship("Enrollment", back_populates="student")
    payment_history = relationship("PaymentHistory", back_populates="student")
    
    def __repr__(self):
        return f"<Student(id={self.id}, name={self.full_name}, grade={self.grade_level})>"