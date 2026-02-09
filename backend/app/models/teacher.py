from sqlalchemy import Column, String, Boolean, ARRAY, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin

class Teacher(Base, TimestampMixin):
    __tablename__ = "teachers"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Authentication & Identity
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    
    # Vietnamese-specific
    zalo_id = Column(String(50))
    whatsapp_number = Column(String(20))
    
    # Role & Permissions
    role = Column(String(20), nullable=False, default='teacher')
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Profile
    bio = Column(String)
    specializations = Column(ARRAY(String))
    
    # Timestamps (from TimestampMixin)
    last_login_at = Column(DateTime(timezone=True))
    
    # Relationships (we'll add these later when we create other models)
    classes = relationship("Class", back_populates="teacher", foreign_keys="Class.teacher_id")
    assistant_classes = relationship("Class", back_populates="assistant_teacher", foreign_keys="Class.assistant_teacher_id")
    
    def __repr__(self):
        return f"<Teacher(id={self.id}, name={self.full_name}, role={self.role})>"