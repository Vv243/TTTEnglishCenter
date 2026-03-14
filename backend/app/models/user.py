import uuid
from sqlalchemy import Column, String, Boolean, Enum as SAEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.teacher)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey('teachers.id'), nullable=True)