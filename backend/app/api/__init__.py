from fastapi import APIRouter

api_router = APIRouter()

# Import routers AFTER creating api_router
from app.api.teachers import router as teachers_router

# Include routers
api_router.include_router(teachers_router, prefix="/teachers", tags=["Teachers"])