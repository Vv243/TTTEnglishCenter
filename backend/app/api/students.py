from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.models.student import Student as StudentModel
from app.schemas.student import Student, StudentCreate, StudentUpdate, StudentList
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=StudentList)
async def get_students(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    grade_level: Optional[str] = Query(None, description="Filter by grade level"),
    payment_cluster: Optional[str] = Query(None, description="Filter by payment cluster"),
    target_exam: Optional[str] = Query(None, description="Filter by target exam"),
    province_city: Optional[str] = Query(None, description="Filter by province/city"),
    db: AsyncSession = Depends(get_db)
):
    query = select(StudentModel)
    
    if is_active is not None:
        query = query.where(StudentModel.is_active == is_active)
    if grade_level:
        query = query.where(StudentModel.grade_level == grade_level)
    if payment_cluster:
        query = query.where(StudentModel.payment_cluster == payment_cluster)
    if target_exam:
        query = query.where(StudentModel.target_exam == target_exam)
    if province_city:
        query = query.where(StudentModel.province_city.ilike(f"%{province_city}%"))
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    query = query.order_by(StudentModel.created_at.desc())
    
    result = await db.execute(query)
    students = result.scalars().all()
    
    return StudentList(students=students, total=total, page=page, page_size=page_size)

@router.get("/{student_id}", response_model=Student)
async def get_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(StudentModel).where(StudentModel.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.post("/", response_model=Student, status_code=201)
async def create_student(
    student_data: StudentCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)   # ← protected
):
    result = await db.execute(
        select(StudentModel).where(StudentModel.parent_phone == student_data.parent_phone)
    )
    existing_siblings = result.scalars().all()
    if existing_siblings:
        print(f"ℹ️ Parent phone {student_data.parent_phone} already has {len(existing_siblings)} student(s)")
    
    from datetime import date
    student_dict = student_data.model_dump()
    if not student_dict.get('enrollment_date'):
        student_dict['enrollment_date'] = date.today()
    student = StudentModel(**student_dict)
    
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student

@router.patch("/{student_id}", response_model=Student)
async def update_student(
    student_id: UUID,
    student_data: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)   # ← protected
):
    result = await db.execute(
        select(StudentModel).where(StudentModel.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
    
    await db.commit()
    await db.refresh(student)
    return student

@router.delete("/{student_id}", status_code=204)
async def delete_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)   # ← protected
):
    result = await db.execute(
        select(StudentModel).where(StudentModel.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.is_active = False
    await db.commit()
    return None