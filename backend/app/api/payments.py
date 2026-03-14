from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
import calendar

from app.database import get_db
from app.core.auth import get_current_user, require_admin
from app.models.payment_history import PaymentHistory
from app.models.enrollment import Enrollment
from app.models.student import Student
from app.models.class_model import Class as ClassModel
from app.models.teacher import Teacher
from app.models.user import User
from app.schemas.payment import (
    RecordPaymentRequest,
    RecordPaymentResponse,
    MonthlyTrackerResponse,
    ClassTrackerCard,
    StudentPaymentStatus,
    StudentPaymentHistoryResponse,
    PaymentHistoryItem,
)

router = APIRouter(prefix="/payments", tags=["payments"])


# ── Helpers ───────────────────────────────────────────────────


def parse_month_year(month_year: str):
    """Parse '2026-03' → (2026, 3)"""
    try:
        parts = month_year.split("-")
        return int(parts[0]), int(parts[1])
    except Exception:
        raise HTTPException(
            status_code=400, detail="month_year must be 'YYYY-MM' format"
        )


def month_label(year: int, month: int) -> str:
    return datetime(year, month, 1).strftime("%B %Y")


def current_month_year() -> str:
    now = date.today()
    return f"{now.year}-{now.month:02d}"


# ── GET /payments/monthly-tracker/ ───────────────────────────
@router.get("/monthly-tracker/", response_model=MonthlyTrackerResponse)
async def get_monthly_tracker(
    month_year: str = Query(
        default=None, description="YYYY-MM, defaults to current month"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not month_year:
        month_year = current_month_year()

    year, month = parse_month_year(month_year)
    _, last_day = calendar.monthrange(year, month)
    month_start = date(year, month, 1)
    month_end = date(year, month, last_day)

    # ── Load all active/scheduled classes with teacher ────────
    classes_result = await db.execute(
        select(ClassModel)
        .options(joinedload(ClassModel.teacher))
        .where(ClassModel.status.in_(["active", "scheduled"]))
        .order_by(ClassModel.class_name)
    )
    classes = classes_result.scalars().unique().all()

    # ── Load all active/scheduled enrollments ─────────────────
    enrollments_result = await db.execute(
        select(Enrollment)
        .options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.class_),
        )
        .where(Enrollment.status.in_(["enrolled", "pending"]))
    )
    enrollments = enrollments_result.scalars().unique().all()

    # ── Load payment records for this month ───────────────────
    payments_result = await db.execute(
        select(PaymentHistory).where(
            and_(
                PaymentHistory.due_date >= month_start,
                PaymentHistory.due_date <= month_end,
            )
        )
    )
    payments = payments_result.scalars().all()

    # Index payments by (student_id, enrollment_id)
    payment_map: dict = {}
    for p in payments:
        key = str(p.student_id)
        if key not in payment_map:
            payment_map[key] = {}
        # Also index by enrollment_id if present
        if p.enrollment_id:
            payment_map[key][str(p.enrollment_id)] = p
        else:
            payment_map[key]["__any__"] = p

    # ── Build class cards ─────────────────────────────────────
    # Group enrollments by class_id
    enroll_by_class: dict = {}
    for e in enrollments:
        cid = str(e.class_id)
        if cid not in enroll_by_class:
            enroll_by_class[cid] = []
        enroll_by_class[cid].append(e)

    class_cards = []
    total_summary = {
        "total_collected": Decimal(0),
        "total_expected": Decimal(0),
        "paid_count": 0,
        "due_count": 0,
        "overdue_count": 0,
    }

    today = date.today()

    for cls in classes:
        cid = str(cls.id)
        class_enrollments = enroll_by_class.get(cid, [])

        # Classes that haven't started yet for this month
        class_not_started = cls.start_date and cls.start_date > month_end

        student_statuses = []
        paid_count = due_count = overdue_count = 0
        total_collected = Decimal(0)
        total_expected = Decimal(0)

        for enr in class_enrollments:
            sid = str(enr.student_id)
            eid = str(enr.id)

            # Monthly amount after discount
            discount = enr.discount_percent or Decimal(0)
            monthly_amount = enr.agreed_tuition_per_session * (1 - discount / 100)
            monthly_amount = monthly_amount.quantize(Decimal("1"))

            total_expected += monthly_amount

            # Find payment record
            payment = None
            if sid in payment_map:
                payment = payment_map[sid].get(eid) or payment_map[sid].get("__any__")

            if class_not_started:
                status = "not_started"
            elif payment:
                status = payment.status  # paid | late | missed
                if payment.status == "paid":
                    paid_count += 1
                    total_collected += payment.amount
                elif payment.status == "late":
                    due_count += 1
                elif payment.status == "missed":
                    overdue_count += 1
            else:
                # No payment record — determine status from due date
                default_due = date(year, month, 5)  # due on 5th of month
                if today > default_due:
                    status = "overdue"
                    overdue_count += 1
                else:
                    status = "due"
                    due_count += 1

            student_statuses.append(
                StudentPaymentStatus(
                    student_id=sid,
                    student_name=enr.student.full_name if enr.student else "Unknown",
                    enrollment_id=eid,
                    agreed_tuition=enr.agreed_tuition_per_session,
                    discount_percent=enr.discount_percent or Decimal(0),
                    monthly_amount=monthly_amount,
                    status=status,
                    paid_date=payment.paid_date if payment else None,
                    due_date=payment.due_date if payment else date(year, month, 5),
                    payment_method=payment.payment_method if payment else None,
                    note=payment.note if payment else None,
                    payment_history_id=str(payment.id) if payment else None,
                )
            )

        # Sort: overdue first, then due, then paid
        status_order = {
            "overdue": 0,
            "missed": 1,
            "due": 2,
            "late": 3,
            "paid": 4,
            "not_started": 5,
        }
        student_statuses.sort(key=lambda s: status_order.get(s.status, 99))

        teacher_name = "Unknown"
        if cls.teacher:
            teacher_name = cls.teacher.full_name

        class_cards.append(
            ClassTrackerCard(
                class_id=cid,
                class_name=cls.class_name,
                level=cls.level,
                teacher_name=teacher_name,
                start_date=cls.start_date,
                end_date=cls.end_date,
                class_status=cls.status,
                total_enrolled=len(class_enrollments),
                paid_count=paid_count,
                due_count=due_count,
                overdue_count=overdue_count,
                total_collected=total_collected,
                total_expected=total_expected,
                students=student_statuses,
            )
        )

        total_summary["total_collected"] += total_collected
        total_summary["total_expected"] += total_expected
        total_summary["paid_count"] += paid_count
        total_summary["due_count"] += due_count
        total_summary["overdue_count"] += overdue_count

    return MonthlyTrackerResponse(
        month_year=month_year,
        month_label=month_label(year, month),
        classes=class_cards,
        summary=total_summary,
    )


# ── POST /payments/record/ ────────────────────────────────────
@router.post("/record/", response_model=RecordPaymentResponse)
async def record_payment(
    payload: RecordPaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.action not in ("paid", "late", "missed"):
        raise HTTPException(
            status_code=400, detail="action must be 'paid', 'late', or 'missed'"
        )

    if payload.payment_method and payload.payment_method not in (
        "cash",
        "bank_transfer",
    ):
        raise HTTPException(
            status_code=400, detail="payment_method must be 'cash' or 'bank_transfer'"
        )

    year, month = parse_month_year(payload.month_year)
    _, last_day = calendar.monthrange(year, month)
    month_start = date(year, month, 1)
    month_end = date(year, month, last_day)

    # Verify student exists
    student_result = await db.execute(
        select(Student).where(Student.id == payload.student_id)
    )
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Look up enrollment for amount if not provided
    agreed_amount = payload.amount
    enrollment = None
    if payload.enrollment_id:
        enr_result = await db.execute(
            select(Enrollment).where(Enrollment.id == payload.enrollment_id)
        )
        enrollment = enr_result.scalar_one_or_none()
        if enrollment and not agreed_amount:
            discount = enrollment.discount_percent or Decimal(0)
            agreed_amount = enrollment.agreed_tuition_per_session * (1 - discount / 100)
            agreed_amount = agreed_amount.quantize(Decimal("1"))

    if not agreed_amount:
        agreed_amount = Decimal(0)

    # Check if payment record already exists for this month
    existing_result = await db.execute(
        select(PaymentHistory).where(
            and_(
                PaymentHistory.student_id == payload.student_id,
                PaymentHistory.due_date >= month_start,
                PaymentHistory.due_date <= month_end,
                (
                    PaymentHistory.enrollment_id == payload.enrollment_id
                    if payload.enrollment_id
                    else True
                ),
            )
        )
    )
    existing = existing_result.scalar_one_or_none()

    # Determine paid_date and due_date
    today = date.today()
    due_date = payload.new_due_date or date(year, month, 5)
    paid_date = today if payload.action == "paid" else None

    # For waive action — amount = 0 but status = paid
    final_amount = agreed_amount
    if payload.action == "paid" and payload.amount is not None:
        final_amount = payload.amount  # allows waive (0) override

    if existing:
        # Update existing record
        existing.status = payload.action
        existing.amount = final_amount
        existing.paid_date = paid_date
        existing.due_date = due_date
        existing.payment_method = payload.payment_method
        existing.note = payload.note
        existing.recorded_by = current_user.id
        if payload.enrollment_id:
            existing.enrollment_id = payload.enrollment_id
        payment_record = existing
    else:
        payment_record = PaymentHistory(
            student_id=payload.student_id,
            enrollment_id=payload.enrollment_id,
            amount=final_amount,
            paid_date=paid_date,
            due_date=due_date,
            status=payload.action,
            payment_method=payload.payment_method,
            note=payload.note,
            recorded_by=current_user.id,
        )
        db.add(payment_record)

    # Auto-flip enrollment to active on first payment
    if payload.action == "paid" and enrollment and enrollment.status == "pending":
        # Only flip to enrolled if the class is currently active
        class_result = await db.execute(select(ClassModel).where(ClassModel.id == enrollment.class_id))
        enr_class = class_result.scalar_one_or_none()
        if enr_class and enr_class.status == "active":
            enrollment.status = "enrolled"

    await db.commit()
    await db.refresh(payment_record)

    recorder_name = current_user.username if current_user else None

    return RecordPaymentResponse(
        id=payment_record.id,
        student_id=payment_record.student_id,
        student_name=student.full_name,
        month_year=payload.month_year,
        status=payment_record.status,
        amount=payment_record.amount,
        payment_method=payment_record.payment_method,
        note=payment_record.note,
        paid_date=payment_record.paid_date,
        due_date=payment_record.due_date,
        recorded_by_name=recorder_name,
    )


# ── GET /payments/student-history/{student_id}/ ───────────────
@router.get(
    "/student-history/{student_id}/", response_model=StudentPaymentHistoryResponse
)
async def get_student_payment_history(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify student
    student_result = await db.execute(select(Student).where(Student.id == student_id))
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Load payment history with enrollment → class join
    payments_result = await db.execute(
        select(PaymentHistory)
        .options(
            joinedload(PaymentHistory.enrollment).joinedload(Enrollment.class_),
            joinedload(PaymentHistory.recorder),
        )
        .where(PaymentHistory.student_id == student_id)
        .order_by(PaymentHistory.due_date.desc())
    )
    payments = payments_result.scalars().unique().all()

    total_paid = Decimal(0)
    total_missed = Decimal(0)
    history_items = []

    for p in payments:
        # Derive month from due_date
        my = f"{p.due_date.year}-{p.due_date.month:02d}"
        ml = p.due_date.strftime("%B %Y")

        class_name = None
        if p.enrollment and p.enrollment.class_:
            class_name = p.enrollment.class_.class_name

        recorder_name = None
        if p.recorder:
            recorder_name = p.recorder.username

        if p.status == "paid":
            total_paid += p.amount
        elif p.status == "missed":
            total_missed += p.amount

        history_items.append(
            PaymentHistoryItem(
                id=str(p.id),
                month_year=my,
                month_label=ml,
                amount=p.amount,
                status=p.status,
                payment_method=p.payment_method,
                paid_date=p.paid_date,
                due_date=p.due_date,
                note=p.note,
                class_name=class_name,
                recorded_by_name=recorder_name,
            )
        )

    total_billed = total_paid + total_missed
    collection_rate = float(total_paid / total_billed) if total_billed > 0 else 1.0

    return StudentPaymentHistoryResponse(
        student_id=str(student.id),
        student_name=student.full_name,
        total_paid=total_paid,
        total_missed=total_missed,
        collection_rate=round(collection_rate, 3),
        history=history_items,
    )
