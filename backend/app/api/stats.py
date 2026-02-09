from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any

from app.database import get_db
from app.models.teacher import Teacher as TeacherModel
from app.models.student import Student as StudentModel
from app.models.class_model import Class as ClassModel
from app.models.enrollment import Enrollment as EnrollmentModel

router = APIRouter()

@router.get("/summary")
async def get_summary(
    db: AsyncSession = Depends(get_db)
) -> Dict[str, int]:
    """
    Quick summary counts for overview cards
    """
    # Teachers count
    result = await db.execute(
        select(func.count()).select_from(TeacherModel).where(TeacherModel.is_active == True)
    )
    teachers = result.scalar() or 0
    
    # Students count
    result = await db.execute(
        select(func.count()).select_from(StudentModel).where(StudentModel.is_active == True)
    )
    students = result.scalar() or 0
    
    # Classes count
    result = await db.execute(
        select(func.count()).select_from(ClassModel).where(ClassModel.status == 'active')
    )
    classes = result.scalar() or 0
    
    # Enrollments count
    result = await db.execute(
        select(func.count()).select_from(EnrollmentModel).where(EnrollmentModel.status == 'active')
    )
    enrollments = result.scalar() or 0
    
    return {
        "active_teachers": teachers,
        "active_students": students,
        "active_classes": classes,
        "active_enrollments": enrollments
    }

@router.get("/dashboard")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get dashboard statistics
    
    Returns overview stats for the 3-category system
    """
    
    # Get summary first
    summary_result = await get_summary(db)
    
    # Payment clusters breakdown
    try:
        result = await db.execute(
            select(
                StudentModel.payment_cluster,
                func.count(StudentModel.id)
            )
            .where(StudentModel.is_active == True)
            .group_by(StudentModel.payment_cluster)
        )
        payment_clusters = {row[0]: row[1] for row in result.all()}
    except Exception as e:
        print(f"Error getting payment clusters: {e}")
        payment_clusters = {}
    
    # Classes by status
    try:
        result = await db.execute(
            select(
                ClassModel.status,
                func.count(ClassModel.id)
            )
            .group_by(ClassModel.status)
        )
        classes_by_status = {row[0]: row[1] for row in result.all()}
    except Exception as e:
        print(f"Error getting classes by status: {e}")
        classes_by_status = {}
    
    # Total teachers
    result = await db.execute(select(func.count()).select_from(TeacherModel))
    total_teachers = result.scalar() or 0
    
    # Total students
    result = await db.execute(select(func.count()).select_from(StudentModel))
    total_students = result.scalar() or 0
    
    return {
        "summary": summary_result,
        "teachers": {
            "total": total_teachers,
            "active": summary_result["active_teachers"]
        },
        "students": {
            "total": total_students,
            "active": summary_result["active_students"],
            "payment_clusters": payment_clusters
        },
        "classes": {
            "total": sum(classes_by_status.values()) if classes_by_status else 0,
            "by_status": classes_by_status
        },
        "enrollments": {
            "total": summary_result["active_enrollments"],
            "active": summary_result["active_enrollments"]
        }
    }