from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.class_model import Class as ClassModel
from app.schemas.class_schema import Class, ClassCreate, ClassUpdate, ClassList
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=ClassList)
async def get_classes(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    level: Optional[str] = Query(None, description="Filter by level"),
    semester: Optional[str] = Query(None, description="Filter by semester"),
    teacher_id: Optional[UUID] = Query(None, description="Filter by teacher ID"),
    day_of_week: Optional[int] = Query(None, ge=0, le=6, description="Filter by day (0=Mon, 6=Sun)"),
    db: AsyncSession = Depends(get_db)
):
    query = select(ClassModel)

    if status:
        query = query.where(ClassModel.status == status)
    if level:
        query = query.where(ClassModel.level == level)
    if semester:
        query = query.where(ClassModel.semester == semester)
    if teacher_id:
        query = query.where(ClassModel.teacher_id == teacher_id)
    if day_of_week is not None:
        query = query.where(ClassModel.day_of_week == day_of_week)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    query = query.order_by(ClassModel.created_at.desc())

    result = await db.execute(query)
    classes = result.scalars().all()

    return ClassList(classes=classes, total=total, page=page, page_size=page_size)

@router.get("/{class_id}", response_model=Class)
async def get_class(
    class_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ClassModel).where(ClassModel.id == class_id)
    )
    class_obj = result.scalar_one_or_none()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_obj

@router.post("/", response_model=Class, status_code=201)
async def create_class(
    class_data: ClassCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)   # ← protected
):
    result = await db.execute(
        select(ClassModel).where(ClassModel.class_code == class_data.class_code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Class code already exists")

    from app.models.teacher import Teacher as TeacherModel
    result = await db.execute(
        select(TeacherModel).where(TeacherModel.id == class_data.teacher_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Teacher not found")

    class_obj = ClassModel(**class_data.model_dump())
    db.add(class_obj)
    await db.commit()
    await db.refresh(class_obj)
    return class_obj

@router.patch("/{class_id}", response_model=Class)
async def update_class(
    class_id: UUID,
    class_data: ClassUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)   # ← protected
):
    result = await db.execute(
        select(ClassModel).where(ClassModel.id == class_id)
    )
    class_obj = result.scalar_one_or_none()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    update_data = class_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(class_obj, field, value)

    await db.commit()
    await db.refresh(class_obj)
    return class_obj

@router.delete("/{class_id}", status_code=204)
async def delete_class(
    class_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)   # ← protected
):
    result = await db.execute(
        select(ClassModel).where(ClassModel.id == class_id)
    )
    class_obj = result.scalar_one_or_none()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # Soft delete — set status to cancelled instead of hard deleting
    # This preserves enrollment history and payment records
    class_obj.status = 'cancelled'
    await db.commit()
    return None

from pydantic import BaseModel as _PydanticBase
from typing import List as _List
from datetime import time as _time

class ConflictCheckRequest(_PydanticBase):
    teacher_id: str
    room_number: str
    days_of_week: list
    start_time: str  # "HH:MM"
    end_time: str    # "HH:MM"
    exclude_class_id: str | None = None  # for edits

class ConflictResult(_PydanticBase):
    has_conflict: bool
    conflicts: list
    warnings: list

@router.post("/check-conflict/")
async def check_conflict(
    payload: ConflictCheckRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import select, and_, or_
    from app.models.teacher import Teacher

    # Parse times
    def parse_time(t: str):
        h, m = t.split(":")
        return int(h) * 60 + int(m)

    req_start = parse_time(payload.start_time)
    req_end   = parse_time(payload.end_time)
    req_days  = set(payload.days_of_week)

    # Load all active/scheduled classes
    q = select(ClassModel).where(ClassModel.status.in_(["active", "scheduled"]))
    if payload.exclude_class_id:
        from uuid import UUID
        q = q.where(ClassModel.id != UUID(payload.exclude_class_id))
    result = await db.execute(q)
    classes = result.scalars().all()

    conflicts = []
    warnings  = []

    for cls in classes:
        cls_days  = set(cls.days_of_week or ([cls.day_of_week] if cls.day_of_week is not None else []))
        overlap_days = req_days & cls_days
        if not overlap_days:
            continue

        cls_start = parse_time(str(cls.start_time)[:5])
        cls_end   = parse_time(str(cls.end_time)[:5])

        # Check time overlap
        time_overlap = req_start < cls_end and req_end > cls_start
        time_adjacent = (
            abs(req_start - cls_end) < 30 or
            abs(req_end - cls_start) < 30
        )

        days_label = ", ".join(["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d] for d in sorted(overlap_days))

        if time_overlap:
            # Hard conflict — same room
            if cls.room_number and cls.room_number == payload.room_number:
                conflicts.append({
                    "type": "room",
                    "message": f"{cls.room_number} is already booked on {days_label} {str(cls.start_time)[:5]}–{str(cls.end_time)[:5]} by {cls.class_name}",
                    "class_id": str(cls.id),
                    "class_name": cls.class_name,
                })
            # Hard conflict — same teacher
            if str(cls.teacher_id) == payload.teacher_id:
                conflicts.append({
                    "type": "teacher",
                    "message": f"Teacher already has {cls.class_name} on {days_label} {str(cls.start_time)[:5]}–{str(cls.end_time)[:5]}",
                    "class_id": str(cls.id),
                    "class_name": cls.class_name,
                })
        elif time_adjacent:
            if cls.room_number and cls.room_number == payload.room_number:
                warnings.append({
                    "type": "room_adjacent",
                    "message": f"Less than 30 min gap with {cls.class_name} in {cls.room_number} on {days_label}",
                    "class_id": str(cls.id),
                    "class_name": cls.class_name,
                })

    return ConflictResult(
        has_conflict=len(conflicts) > 0,
        conflicts=conflicts,
        warnings=warnings,
    )


@router.get("/schedule-grid/")
async def get_schedule_grid(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all active/scheduled classes formatted for the schedule grid"""
    from sqlalchemy.orm import joinedload

    result = await db.execute(
        select(ClassModel)
        .options(joinedload(ClassModel.teacher))
        .where(ClassModel.status.in_(["active", "scheduled"]))
    )
    classes = result.scalars().unique().all()

    grid = []
    for cls in classes:
        days = cls.days_of_week or ([cls.day_of_week] if cls.day_of_week is not None else [])
        is_own = (
            current_user.role == "admin" or
            (hasattr(current_user, "teacher_id") and str(current_user.teacher_id) == str(cls.teacher_id))
        )
        grid.append({
            "class_id": str(cls.id),
            "class_name": cls.class_name,
            "class_code": cls.class_code,
            "teacher_id": str(cls.teacher_id),
            "teacher_name": cls.teacher.full_name if cls.teacher else "Unknown",
            "days_of_week": days,
            "start_time": str(cls.start_time)[:5],
            "end_time": str(cls.end_time)[:5],
            "room_number": cls.room_number,
            "level": cls.level,
            "status": cls.status,
            "is_own": is_own,
            "current_enrollment": cls.current_enrollment,
            "max_students": cls.max_students,
        })

    return grid
