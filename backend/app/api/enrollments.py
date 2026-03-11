from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from typing import List, Optional
from uuid import UUID
from datetime import date

from app.database import get_db
from app.models.enrollment import Enrollment as EnrollmentModel
from app.models.student import Student as StudentModel
from app.models.class_model import Class as ClassModel
from app.schemas.enrollment import Enrollment, EnrollmentCreate, EnrollmentUpdate, EnrollmentList
from app.core.auth import get_current_user
from app.models.user import User

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
    query = select(EnrollmentModel).options(joinedload(EnrollmentModel.student), joinedload(EnrollmentModel.class_))

    if status:
        query = query.where(EnrollmentModel.status == status)
    if student_id:
        query = query.where(EnrollmentModel.student_id == student_id)
    if class_id:
        query = query.where(EnrollmentModel.class_id == class_id)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    query = query.order_by(EnrollmentModel.created_at.desc())

    result = await db.execute(query)
    enrollments = result.scalars().all()

    return EnrollmentList(enrollments=enrollments, total=total, page=page, page_size=page_size)

@router.get("/{enrollment_id}", response_model=Enrollment)
async def get_enrollment(
    enrollment_id: UUID,
    db: AsyncSession = Depends(get_db)
):
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
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)   # ← protected
):
    result = await db.execute(
        select(StudentModel).where(StudentModel.id == enrollment_data.student_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Student not found")

    result = await db.execute(
        select(ClassModel).where(ClassModel.id == enrollment_data.class_id)
    )
    class_obj = result.scalar_one_or_none()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    if class_obj.current_enrollment >= class_obj.max_students:
        raise HTTPException(
            status_code=400,
            detail=f"Class is full ({class_obj.current_enrollment}/{class_obj.max_students})"
        )

    result = await db.execute(
        select(EnrollmentModel).where(
            EnrollmentModel.student_id == enrollment_data.student_id,
            EnrollmentModel.class_id == enrollment_data.class_id,
            EnrollmentModel.status == 'active'
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Student already enrolled in this class")

    enrollment = EnrollmentModel(**enrollment_data.model_dump())
    class_obj.current_enrollment += 1
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment

@router.patch("/{enrollment_id}", response_model=Enrollment)
async def update_enrollment(
    enrollment_id: UUID,
    enrollment_data: EnrollmentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)   # ← protected
):
    result = await db.execute(
        select(EnrollmentModel).where(EnrollmentModel.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    update_data = enrollment_data.model_dump(exclude_unset=True)

    if 'status' in update_data and update_data['status'] == 'dropped':
        if not enrollment.drop_date:
            enrollment.drop_date = date.today()
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
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)   # ← protected
):
    result = await db.execute(
        select(EnrollmentModel).where(EnrollmentModel.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Soft delete — set status to dropped instead of hard deleting
    if enrollment.status == 'active':
        result = await db.execute(
            select(ClassModel).where(ClassModel.id == enrollment.class_id)
        )
        class_obj = result.scalar_one_or_none()
        if class_obj and class_obj.current_enrollment > 0:
            class_obj.current_enrollment -= 1

    enrollment.status = 'dropped'
    if not enrollment.drop_date:
        enrollment.drop_date = date.today()
    await db.commit()
    return None




