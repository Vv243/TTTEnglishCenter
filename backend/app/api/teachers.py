from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.teacher import Teacher as TeacherModel
from app.schemas.teacher import Teacher, TeacherCreate, TeacherUpdate, TeacherList

router = APIRouter()

@router.get("/", response_model=TeacherList)
async def get_teachers(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    is_active: bool = Query(None, description="Filter by active status"),
    role: str = Query(None, description="Filter by role"),
    db: AsyncSession = Depends(get_db)
):
    """Get list of teachers with pagination"""
    query = select(TeacherModel)
    
    if is_active is not None:
        query = query.where(TeacherModel.is_active == is_active)
    if role:
        query = query.where(TeacherModel.role == role)
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    query = query.order_by(TeacherModel.created_at.desc())
    
    result = await db.execute(query)
    teachers = result.scalars().all()
    
    return TeacherList(
        teachers=teachers,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{teacher_id}", response_model=Teacher)
async def get_teacher(
    teacher_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific teacher by ID"""
    result = await db.execute(
        select(TeacherModel).where(TeacherModel.id == teacher_id)
    )
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    return teacher

@router.post("/", response_model=Teacher)
async def create_teacher(
    teacher_data: TeacherCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new teacher profile"""
    # Check email uniqueness
    existing = await db.execute(
        select(TeacherModel).where(TeacherModel.email == teacher_data.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A teacher with this email already exists")

    # Hash the password before storing — teachers table has password_hash NOT NULL
    from app.core.auth import hash_password

    teacher = TeacherModel(
        email=teacher_data.email,
        full_name=teacher_data.full_name,
        phone=teacher_data.phone,
        zalo_id=teacher_data.zalo_id,
        whatsapp_number=teacher_data.whatsapp_number,
        role=teacher_data.role,
        is_active=teacher_data.is_active,
        bio=teacher_data.bio,
        specializations=teacher_data.specializations or [],
        password_hash=hash_password(teacher_data.password),
    )
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return teacher