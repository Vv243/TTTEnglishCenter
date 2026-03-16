from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.api import api_router
from app.database import engine
from app.api.ml import router as ml_router
from app.models import payment_history
from app.models import attendance
from app.api.payments import router as payments_router
load_dotenv()

from app.api.auth import router as auth_router

# Lifespan events (startup/shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting TTTEnglishCenter API...")
    print(f"📊 Database: Connected to port 5433")
    yield
    # Shutdown
    print("👋 Shutting down TTTEnglishCenter API...")
    await engine.dispose()

# Create FastAPI app
app = FastAPI(
    title="TTTEnglishCenter API",
    description="Backend API for Vietnamese English Tutoring Center Management System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")

app.include_router(payments_router, prefix="/api/v1")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "TTTEnglishCenter API",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to TTTEnglishCenter API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
    }



# Force redeploy 03/16/2026 17:28:08
