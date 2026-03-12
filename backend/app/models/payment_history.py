from sqlalchemy import Column, String, Numeric, Date, ForeignKey, TIMESTAMP, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.models.base import Base


class PaymentHistory(Base):
    __tablename__ = "payment_history"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id    = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id", ondelete="SET NULL"), nullable=True)
    amount        = Column(Numeric(12, 0), nullable=False)
    paid_date     = Column(Date, nullable=True)
    due_date      = Column(Date, nullable=False)
    status        = Column(String(10), nullable=False)  # paid | late | missed
    payment_method = Column(String(20), nullable=True)  # cash | bank_transfer
    note          = Column(Text, nullable=True)
    recorded_by   = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at    = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    student    = relationship("Student", back_populates="payment_history")
    enrollment = relationship("Enrollment", foreign_keys=[enrollment_id])
    recorder   = relationship("User", foreign_keys=[recorded_by])