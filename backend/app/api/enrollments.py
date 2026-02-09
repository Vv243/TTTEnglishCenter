from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID
from datetime import date

from app.database import get_db
from app.models.enrollment import Enrollment as EnrollmentModel
from app.models.student import Student as StudentModel
from app.models.class_model import Class as ClassModel
from app.schemas.enrollment import Enrollment, EnrollmentCreate, EnrollmentUpdate, EnrollmentList

router = APIRouter()

@router.get("/", response_model=EnrollmentList)
async def get_enrollments(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    student_id: Optional[UUID] = Query(None, description="Filter by student ID"),
    class_id: Optional[UUID] = Query(None, description="Filter by class ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of enrollments with pagination and filters
    
    Supports multiple enrollments per student (3-category system)
    """
    # Build query
    query = select(EnrollmentModel)
    
    # Apply filters
    if status:
        query = query.where(EnrollmentModel.status == status)
    if student_id:
        query = query.where(EnrollmentModel.student_id == student_id)
    if class_id:
        query = query.where(EnrollmentModel.class_id == class_id)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    query = query.order_by(EnrollmentModel.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    enrollments = result.scalars().all()
    
    return EnrollmentList(
        enrollments=enrollments,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{enrollment_id}", response_model=Enrollment)
async def get_enrollment(
    enrollment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific enrollment by ID
    """
    result = await db.execute(
        select(EnrollmentModel).where(EnrollmentModel.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    return enrollment

@router.post("/", response_model=Enrollment, status_code=201)
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new enrollment (enroll student in class)
    
    Supports multiple enrollments per student across 3 categories:
    - School Reinforcement (e.g., SECONDARY-7)
    - Foreign Exam (e.g., KET)
    - General Communication (e.g., GENERAL-B1)
    """
    # Check if student exists
    result = await db.execute(
        select(StudentModel).where(StudentModel.id == enrollment_data.student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if class exists
    result = await db.execute(
        select(ClassModel).where(ClassModel.id == enrollment_data.class_id)
    )
    class_obj = result.scalar_one_or_none()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if class is full
    if class_obj.current_enrollment >= class_obj.max_students:
        raise HTTPException(
            status_code=400, 
            detail=f"Class is full ({class_obj.current_enrollment}/{class_obj.max_students})"
        )
    
    # Check if student already enrolled in this class
    result = await db.execute(
        select(EnrollmentModel).where(
            EnrollmentModel.student_id == enrollment_data.student_id,
            EnrollmentModel.class_id == enrollment_data.class_id,
            EnrollmentModel.status == 'active'
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled in this class")
    
    # Create enrollment
    enrollment = EnrollmentModel(**enrollment_data.model_dump())
    
    # Update class enrollment count
    class_obj.current_enrollment += 1
    
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    
    return enrollment

@router.patch("/{enrollment_id}", response_model=Enrollment)
async def update_enrollment(
    enrollment_id: UUID,
    enrollment_data: EnrollmentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update an enrollment's information
    
    Can update:
    - Status (active, dropped, completed, suspended)
    - Academic progress (attendance_rate, scores)
    - Payment details (discount)
    """
    # Get existing enrollment
    result = await db.execute(
        select(EnrollmentModel).where(EnrollmentModel.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Update fields
    update_data = enrollment_data.model_dump(exclude_unset=True)
    
    # If status changed to 'dropped', set drop_date
    if 'status' in update_data and update_data['status'] == 'dropped':
        if not enrollment.drop_date:
            enrollment.drop_date = date.today()
        
        # Decrease class enrollment count
        result = await db.execute(
            select(ClassModel).where(ClassModel.id == enrollment.class_id)
        )
        class_obj = result.scalar_one_or_none()
        if class_obj and class_obj.current_enrollment > 0:
            class_obj.current_enrollment -= 1
    
    for field, value in update_data.items():
        setattr(enrollment, field, value)
    
    await db.commit()
    await db.refresh(enrollment)
    
    return enrollment

@router.delete("/{enrollment_id}", status_code=204)
async def delete_enrollment(
    enrollment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an enrollment (hard delete)
    """
    result = await db.execute(
        select(EnrollmentModel).where(EnrollmentModel.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Decrease class enrollment count if active
    if enrollment.status == 'active':
        result = await db.execute(
            select(ClassModel).where(ClassModel.id == enrollment.class_id)
        )
        class_obj = result.scalar_one_or_none()
        if class_obj and class_obj.current_enrollment > 0:
            class_obj.current_enrollment -= 1
    
    # Hard delete
    await db.delete(enrollment)
    await db.commit()
    
    return None