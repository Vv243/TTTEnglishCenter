from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.class_model import Class as ClassModel
from app.schemas.class_schema import Class, ClassCreate, ClassUpdate, ClassList

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
    """
    Get list of classes with pagination and filters
    
    Supports 3-category system:
    - Category 1 (School): primary_1-5, secondary_6-9, high_10-12
    - Category 2 (Foreign Exam): starters, movers, flyers, ket, pet, fce, ielts, toefl, sat
    - Category 3 (General): general_english
    """
    # Build query
    query = select(ClassModel)
    
    # Apply filters
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
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    query = query.order_by(ClassModel.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    classes = result.scalars().all()
    
    return ClassList(
        classes=classes,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{class_id}", response_model=Class)
async def get_class(
    class_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific class by ID
    """
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
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new class
    
    Example - School Reinforcement:
    {
        "class_code": "SECONDARY-7-WED-18H",
        "level": "secondary_7",
        ...
    }
    
    Example - Foreign Exam:
    {
        "class_code": "KET-A2-MON-17H",
        "level": "ket",
        ...
    }
    
    Example - General Communication:
    {
        "class_code": "GENERAL-B1-THU-18H",
        "level": "general_english",
        ...
    }
    """
    # Check if class_code already exists
    result = await db.execute(
        select(ClassModel).where(ClassModel.class_code == class_data.class_code)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Class code already exists")
    
    # Check if teacher exists
    from app.models.teacher import Teacher as TeacherModel
    result = await db.execute(
        select(TeacherModel).where(TeacherModel.id == class_data.teacher_id)
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Create class
    class_obj = ClassModel(**class_data.model_dump())
    
    db.add(class_obj)
    await db.commit()
    await db.refresh(class_obj)
    
    return class_obj

@router.patch("/{class_id}", response_model=Class)
async def update_class(
    class_id: UUID,
    class_data: ClassUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a class's information
    """
    # Get existing class
    result = await db.execute(
        select(ClassModel).where(ClassModel.id == class_id)
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Update fields
    update_data = class_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(class_obj, field, value)
    
    await db.commit()
    await db.refresh(class_obj)
    
    return class_obj

@router.delete("/{class_id}", status_code=204)
async def delete_class(
    class_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a class (hard delete - only if no enrollments)
    """
    result = await db.execute(
        select(ClassModel).where(ClassModel.id == class_id)
    )
    class_obj = result.scalar_one_or_none()
    
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if class has enrollments
    from app.models.enrollment import Enrollment as EnrollmentModel
    result = await db.execute(
        select(func.count()).where(EnrollmentModel.class_id == class_id)
    )
    enrollment_count = result.scalar()
    
    if enrollment_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete class with {enrollment_count} enrollment(s). Set status to 'cancelled' instead."
        )
    
    # Hard delete (no enrollments)
    await db.delete(class_obj)
    await db.commit()
    
    return None