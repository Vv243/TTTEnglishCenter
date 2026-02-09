from sqlalchemy import Column, String, Integer, Date, Time, Numeric, Boolean, CheckConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin

class Class(Base, TimestampMixin):
    __tablename__ = "classes"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Class Identity
    class_code = Column(String(20), unique=True, nullable=False)
    class_name = Column(String(100), nullable=False)
    
    # Teacher Assignment
    teacher_id = Column(UUID(as_uuid=True), ForeignKey('teachers.id', ondelete='RESTRICT'), nullable=False, index=True)
    assistant_teacher_id = Column(UUID(as_uuid=True), ForeignKey('teachers.id', ondelete='SET NULL'), index=True)
    
    # Schedule
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    
    # Location
    room_number = Column(String(20))
    building = Column(String(50))
    
    # Academic Details
    level = Column(String(20), nullable=False)
    curriculum = Column(String(50))
    textbook = Column(String(100))
    
    # Capacity
    max_students = Column(Integer, nullable=False, default=15)
    current_enrollment = Column(Integer, nullable=False, default=0)
    
    # Semester/Term
    semester = Column(String(20), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_sessions = Column(Integer, nullable=False)
    sessions_per_month = Column(Integer, nullable=False, default=4)
    
    # Pricing
    tuition_per_session = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default='VND')
    
    # Status
    status = Column(String(20), nullable=False, default='scheduled', index=True)
    
    # Notes
    description = Column(String)
    prerequisites = Column(String)
    learning_objectives = Column(String)
    
    # Relationships
    teacher = relationship("Teacher", back_populates="classes", foreign_keys=[teacher_id])
    assistant_teacher = relationship("Teacher", back_populates="assistant_classes", foreign_keys=[assistant_teacher_id])
    enrollments = relationship("Enrollment", back_populates="class_")
    
    def __repr__(self):
        return f"<Class(id={self.id}, code={self.class_code}, name={self.class_name})>"