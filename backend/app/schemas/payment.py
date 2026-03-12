from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


# ── Record Payment ────────────────────────────────────────────
class RecordPaymentRequest(BaseModel):
    student_id: UUID4
    enrollment_id: Optional[UUID4] = None
    month_year: str           # "2026-03" format
    action: str               # "paid" | "late" | "missed"
    payment_method: Optional[str] = None   # "cash" | "bank_transfer"
    amount: Optional[Decimal] = None       # override; defaults to agreed tuition
    note: Optional[str] = None
    new_due_date: Optional[date] = None    # for postpone (late) action


class RecordPaymentResponse(BaseModel):
    id: UUID4
    student_id: UUID4
    student_name: str
    month_year: str
    status: str
    amount: Decimal
    payment_method: Optional[str]
    note: Optional[str]
    paid_date: Optional[date]
    due_date: date
    recorded_by_name: Optional[str]

    class Config:
        from_attributes = True


# ── Monthly Tracker ───────────────────────────────────────────
class StudentPaymentStatus(BaseModel):
    student_id: str
    student_name: str
    enrollment_id: str
    agreed_tuition: Decimal
    discount_percent: Decimal
    monthly_amount: Decimal       # after discount
    status: str                   # "paid" | "late" | "missed" | "due" | "not_started"
    paid_date: Optional[date]
    due_date: Optional[date]
    payment_method: Optional[str]
    note: Optional[str]
    payment_history_id: Optional[str]


class ClassTrackerCard(BaseModel):
    class_id: str
    class_name: str
    level: str
    teacher_name: str
    start_date: Optional[date]
    end_date: Optional[date]
    class_status: str
    total_enrolled: int
    paid_count: int
    due_count: int
    overdue_count: int
    total_collected: Decimal
    total_expected: Decimal
    students: List[StudentPaymentStatus]


class MonthlyTrackerResponse(BaseModel):
    month_year: str          # "2026-03"
    month_label: str         # "March 2026"
    classes: List[ClassTrackerCard]
    summary: dict


# ── Student Payment History ───────────────────────────────────
class PaymentHistoryItem(BaseModel):
    id: str
    month_year: str
    month_label: str
    amount: Decimal
    status: str
    payment_method: Optional[str]
    paid_date: Optional[date]
    due_date: date
    note: Optional[str]
    class_name: Optional[str]
    recorded_by_name: Optional[str]

    class Config:
        from_attributes = True


class StudentPaymentHistoryResponse(BaseModel):
    student_id: str
    student_name: str
    total_paid: Decimal
    total_missed: Decimal
    collection_rate: float
    history: List[PaymentHistoryItem]