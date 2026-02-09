from fastapi import APIRouter

api_router = APIRouter()

# Import routers AFTER creating api_router
from app.api.teachers import router as teachers_router
from app.api.students import router as students_router
from app.api.classes import router as classes_router
from app.api.enrollments import router as enrollments_router
from app.api.stats import router as stats_router

# Include routers
api_router.include_router(teachers_router, prefix="/teachers", tags=["Teachers"])
api_router.include_router(students_router, prefix="/students", tags=["Students"])
api_router.include_router(classes_router, prefix="/classes", tags=["Classes"])
api_router.include_router(enrollments_router, prefix="/enrollments", tags=["Enrollments"])
api_router.include_router(stats_router, prefix="/stats", tags=["Statistics"])