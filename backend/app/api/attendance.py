from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID
from decimal import Decimal

from app.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.attendance import Attendance, SessionCancellation
from app.models.enrollment import Enrollment
from app.models.class_model import Class as ClassModel
from app.models.student import Student
from app.schemas.attendance import (
    BulkAttendanceRequest,
    AttendanceItem,
    SessionAttendanceResponse,
    CancelSessionRequest,
    CancelSessionResponse,
    TodayClassItem,
)

router = APIRouter(prefix="/attendance", tags=["attendance"])

DAY_MAP = {0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"}


# ── GET /attendance/today/ ─────────────────────────────────────
# Returns classes scheduled for today for the current user
@router.get("/today/", response_model=List[TodayClassItem])
async def get_today_classes(
    target_date: Optional[date] = Query(None, description="Date to check (defaults to today)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_date = target_date or date.today()
    day_of_week = check_date.weekday()  # 0=Mon, 6=Sun
    # Convert Python weekday to our stored format (0=Sun, 1=Mon...)
    stored_dow = (day_of_week + 1) % 7

    # Load active/scheduled classes
    query = select(ClassModel).options(joinedload(ClassModel.teacher)).where(
        ClassModel.status.in_(["active", "scheduled"])
    )

    # Filter by teacher if not admin
    if current_user.role != "admin":
        # Use teacher_id link from users table
        if current_user.teacher_id:
            query = query.where(ClassModel.teacher_id == current_user.teacher_id)
        else:
            # No linked teacher — return empty
            return []

    result = await db.execute(query)
    classes = result.scalars().unique().all()

    # Filter classes that run on this day
    todays_classes = []
    for cls in classes:
        days = cls.days_of_week or ([cls.day_of_week] if cls.day_of_week is not None else [])
        if stored_dow not in days:
            # Also check makeup sessions
            makeup_result = await db.execute(
                select(Attendance).where(
                    and_(
                        Attendance.class_id == cls.id,
                        Attendance.session_date == check_date,
                        Attendance.session_type == "makeup",
                    )
                ).limit(1)
            )
            if not makeup_result.scalar_one_or_none():
                continue

        # Check if attendance already recorded for this session
        att_result = await db.execute(
            select(func.count()).where(
                and_(
                    Attendance.class_id == cls.id,
                    Attendance.session_date == check_date,
                )
            )
        )
        att_count = att_result.scalar() or 0

        # Check if session cancelled
        cancel_result = await db.execute(
            select(SessionCancellation).where(
                and_(
                    SessionCancellation.class_id == cls.id,
                    SessionCancellation.session_date == check_date,
                )
            )
        )
        is_cancelled = cancel_result.scalar_one_or_none() is not None

        # Count enrolled students
        enr_result = await db.execute(
            select(func.count()).where(
                and_(
                    Enrollment.class_id == cls.id,
                    Enrollment.status == "enrolled",
                )
            )
        )
        enrolled_count = enr_result.scalar() or 0

        todays_classes.append(TodayClassItem(
            class_id=str(cls.id),
            class_name=cls.class_name,
            class_code=cls.class_code,
            start_time=str(cls.start_time),
            end_time=str(cls.end_time),
            room_number=cls.room_number,
            level=cls.level,
            enrolled_count=enrolled_count,
            attendance_recorded=att_count > 0,
            is_cancelled=is_cancelled,
            session_date=check_date,
        ))

    # Sort by start time
    todays_classes.sort(key=lambda x: x.start_time)
    return todays_classes


# ── GET /attendance/session/ ───────────────────────────────────
# Returns attendance for a specific class + date
@router.get("/session/", response_model=SessionAttendanceResponse)
async def get_session_attendance(
    class_id: UUID = Query(...),
    session_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Load class
    cls_result = await db.execute(select(ClassModel).where(ClassModel.id == class_id))
    cls = cls_result.scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    # Load existing attendance records
    att_result = await db.execute(
        select(Attendance)
        .options(
            joinedload(Attendance.student),
            joinedload(Attendance.recorder),
        )
        .where(
            and_(
                Attendance.class_id == class_id,
                Attendance.session_date == session_date,
            )
        )
    )
    existing = att_result.scalars().unique().all()
    already_recorded = len(existing) > 0

    recorded_items = [
        AttendanceItem(
            id=a.id,
            class_id=a.class_id,
            enrollment_id=a.enrollment_id,
            student_id=a.student_id,
            student_name=a.student.full_name if a.student else None,
            session_date=a.session_date,
            session_type=a.session_type,
            session_status=a.session_status,
            status=a.status,
            note=a.note,
            makeup_reason=a.makeup_reason,
            recorded_by_name=a.recorder.username if a.recorder else None,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in existing
    ]

    # Load enrolled students not yet recorded
    recorded_enrollment_ids = {str(a.enrollment_id) for a in existing}

    enr_result = await db.execute(
        select(Enrollment)
        .options(joinedload(Enrollment.student))
        .where(
            and_(
                Enrollment.class_id == class_id,
                Enrollment.status == "enrolled",
            )
        )
    )
    enrollments = enr_result.scalars().unique().all()

    unrecorded = [
        {
            "enrollment_id": str(e.id),
            "student_id": str(e.student_id),
            "student_name": e.student.full_name if e.student else "Unknown",
            "grade_level": e.student.grade_level if e.student else None,
        }
        for e in enrollments
        if str(e.id) not in recorded_enrollment_ids
    ]

    session_type = "regular"
    if existing:
        session_type = existing[0].session_type

    return SessionAttendanceResponse(
        class_id=str(class_id),
        class_name=cls.class_name,
        session_date=session_date,
        session_type=session_type,
        already_recorded=already_recorded,
        records=recorded_items,
        unrecorded_students=unrecorded,
    )


# ── POST /attendance/bulk/ ─────────────────────────────────────
# Mark attendance for a whole class session at once
@router.post("/bulk/", status_code=200)
async def record_bulk_attendance(
    payload: BulkAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.session_type not in ("regular", "makeup"):
        raise HTTPException(status_code=400, detail="session_type must be 'regular' or 'makeup'")

    if payload.session_type == "makeup" and not payload.makeup_reason:
        raise HTTPException(status_code=400, detail="makeup_reason is required for makeup sessions")

    saved = 0
    updated = 0

    for record in payload.records:
        if record.status not in ("present", "absent", "late"):
            raise HTTPException(status_code=400, detail=f"Invalid status: {record.status}")

        # Check existing
        existing_result = await db.execute(
            select(Attendance).where(
                and_(
                    Attendance.enrollment_id == record.enrollment_id,
                    Attendance.session_date == payload.session_date,
                )
            )
        )
        existing = existing_result.scalar_one_or_none()

        if existing:
            existing.status = record.status
            existing.note = record.note
            existing.recorded_by = current_user.id
            updated += 1
        else:
            att = Attendance(
                class_id=payload.class_id,
                enrollment_id=record.enrollment_id,
                student_id=record.student_id,
                session_date=payload.session_date,
                session_type=payload.session_type,
                session_status="completed",
                status=record.status,
                note=record.note,
                makeup_reason=payload.makeup_reason,
                recorded_by=current_user.id,
            )
            db.add(att)
            saved += 1

    await db.commit()

    # Auto-update attendance_rate on each enrollment
    for record in payload.records:
        enr_result = await db.execute(
            select(Enrollment).where(Enrollment.id == record.enrollment_id)
        )
        enrollment = enr_result.scalar_one_or_none()
        if not enrollment:
            continue

        # Count total sessions and present/late for this enrollment
        total_result = await db.execute(
            select(func.count()).where(
                and_(
                    Attendance.enrollment_id == record.enrollment_id,
                    Attendance.session_status == "completed",
                )
            )
        )
        total_sessions = total_result.scalar() or 0

        present_result = await db.execute(
            select(func.count()).where(
                and_(
                    Attendance.enrollment_id == record.enrollment_id,
                    Attendance.status.in_(["present", "late"]),
                    Attendance.session_status == "completed",
                )
            )
        )
        present_count = present_result.scalar() or 0

        if total_sessions > 0:
            rate = Decimal(str(round((present_count / total_sessions) * 100, 2)))
            enrollment.attendance_rate = rate

    await db.commit()

    return {
        "message": f"Attendance recorded — {saved} new, {updated} updated",
        "saved": saved,
        "updated": updated,
        "session_date": str(payload.session_date),
    }


# ── POST /attendance/cancel-session/ ──────────────────────────
@router.post("/cancel-session/", response_model=CancelSessionResponse)
async def cancel_session(
    payload: CancelSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check existing cancellation
    existing_result = await db.execute(
        select(SessionCancellation).where(
            and_(
                SessionCancellation.class_id == payload.class_id,
                SessionCancellation.session_date == payload.session_date,
            )
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing:
        existing.reason = payload.reason
        existing.message_sent = payload.message_sent
        cancellation = existing
    else:
        cancellation = SessionCancellation(
            class_id=payload.class_id,
            session_date=payload.session_date,
            reason=payload.reason,
            message_sent=payload.message_sent,
            cancelled_by=current_user.id,
        )
        db.add(cancellation)

    await db.commit()
    await db.refresh(cancellation)

    return CancelSessionResponse(
        id=cancellation.id,
        class_id=cancellation.class_id,
        session_date=cancellation.session_date,
        reason=cancellation.reason,
        message_sent=cancellation.message_sent,
        created_at=cancellation.created_at,
    )


# ── GET /attendance/history/ ───────────────────────────────────
# Past sessions for a class — for editing past attendance
@router.get("/history/")
async def get_attendance_history(
    class_id: UUID = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Attendance.session_date, Attendance.session_type, func.count().label("count"))
        .where(Attendance.class_id == class_id)
        .group_by(Attendance.session_date, Attendance.session_type)
        .order_by(Attendance.session_date.desc())
        .limit(30)
    )
    rows = result.all()
    return [
        {"session_date": str(r.session_date), "session_type": r.session_type, "student_count": r.count}
        for r in rows
    ]