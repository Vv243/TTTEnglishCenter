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