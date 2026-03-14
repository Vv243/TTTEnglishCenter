from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


class AttendanceRecord(BaseModel):
    enrollment_id: UUID
    student_id: UUID
    status: str  # present | absent | late
    note: Optional[str] = None


class BulkAttendanceRequest(BaseModel):
    class_id: UUID
    session_date: date
    session_type: str = "regular"
    makeup_reason: Optional[str] = None
    records: List[AttendanceRecord]


class AttendanceItem(BaseModel):
    id: UUID
    class_id: UUID
    enrollment_id: UUID
    student_id: UUID
    student_name: Optional[str] = None
    session_date: date
    session_type: str
    session_status: str
    status: str
    note: Optional[str] = None
    makeup_reason: Optional[str] = None
    recorded_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionAttendanceResponse(BaseModel):
    class_id: str
    class_name: str
    session_date: date
    session_type: str
    already_recorded: bool
    records: List[AttendanceItem]
    # Students not yet recorded (for first-time marking)
    unrecorded_students: List[dict]


class ClassSessionsResponse(BaseModel):
    class_id: str
    class_name: str
    sessions: List[date]


class CancelSessionRequest(BaseModel):
    class_id: UUID
    session_date: date
    reason: Optional[str] = None
    message_sent: Optional[str] = None


class CancelSessionResponse(BaseModel):
    id: UUID
    class_id: UUID
    session_date: date
    reason: Optional[str] = None
    message_sent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TodayClassItem(BaseModel):
    class_id: str
    class_name: str
    class_code: str
    start_time: str
    end_time: str
    room_number: Optional[str] = None
    level: str
    enrolled_count: int
    attendance_recorded: bool
    is_cancelled: bool
    session_date: date