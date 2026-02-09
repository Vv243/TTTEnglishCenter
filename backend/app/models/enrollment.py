from sqlalchemy import Column, String, Date, Numeric, Boolean, Integer, DateTime, CheckConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin

class Enrollment(Base, TimestampMixin):
    __tablename__ = "enrollments"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Keys
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    class_id = Column(UUID(as_uuid=True), ForeignKey('classes.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Enrollment Details
    enrollment_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default='active', index=True)
    
    # Waitlist tracking
    waitlist_position = Column(Integer)
    waitlist_date = Column(DateTime(timezone=True))
    
    # Drop/Withdrawal Info
    drop_date = Column(Date)
    drop_reason = Column(String)
    
    # Payment Agreement
    agreed_tuition_per_session = Column(Numeric(10, 2), nullable=False)
    discount_percent = Column(Numeric(5, 2), default=0)
    discount_reason = Column(String)
    
    # Academic Progress (Cached)
    attendance_rate = Column(Numeric(5, 2), default=0)
    average_score = Column(Numeric(5, 2))
    last_test_score = Column(Numeric(5, 2))
    last_test_date = Column(Date)
    progress_trend = Column(String(20))
    predicted_final_score = Column(Numeric(5, 2))
    prediction_confidence = Column(Numeric(5, 2))
    prediction_updated_at = Column(DateTime(timezone=True))
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    class_ = relationship("Class", back_populates="enrollments")
    
    def __repr__(self):
        return f"<Enrollment(id={self.id}, student_id={self.student_id}, status={self.status})>"