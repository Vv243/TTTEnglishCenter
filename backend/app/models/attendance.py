from sqlalchemy import Column, String, Date, Text, ForeignKey, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship
import uuid
from app.models.base import Base, TimestampMixin


class Attendance(Base, TimestampMixin):
    __tablename__ = "attendance"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id       = Column(UUID(as_uuid=True), ForeignKey('classes.id', ondelete='CASCADE'), nullable=False, index=True)
    enrollment_id  = Column(UUID(as_uuid=True), ForeignKey('enrollments.id', ondelete='CASCADE'), nullable=False)
    student_id     = Column(UUID(as_uuid=True), ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    session_date   = Column(Date, nullable=False)
    session_type   = Column(String(10), nullable=False, default='regular')
    session_status = Column(String(10), nullable=False, default='completed')
    status         = Column(String(10), nullable=False, default='present')
    note           = Column(Text, nullable=True)
    makeup_reason  = Column(Text, nullable=True)
    recorded_by    = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

    # Relationships
    student    = relationship("Student", lazy="noload")
    class_     = relationship("Class", foreign_keys=[class_id], lazy="noload")
    enrollment = relationship("Enrollment", lazy="noload")
    recorder   = relationship("User", foreign_keys=[recorded_by], lazy="noload")

    __table_args__ = (
        CheckConstraint("session_type IN ('regular', 'makeup')", name="attendance_session_type_check"),
        CheckConstraint("session_status IN ('completed', 'cancelled')", name="attendance_session_status_check"),
        CheckConstraint("status IN ('present', 'absent', 'late')", name="attendance_status_check"),
    )


class SessionCancellation(Base):
    __tablename__ = "session_cancellations"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_id     = Column(UUID(as_uuid=True), ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    session_date = Column(Date, nullable=False)
    reason       = Column(Text, nullable=True)
    message_sent = Column(Text, nullable=True)
    cancelled_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    created_at   = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    class_    = relationship("Class", foreign_keys=[class_id], lazy="noload")
    canceller = relationship("User", foreign_keys=[cancelled_by], lazy="noload")