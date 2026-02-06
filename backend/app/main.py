"""
TTTEnglishCenter API
FastAPI backend for learning management system
"""
from fastapi import FastAPI

app = FastAPI(
    title="TTTEnglishCenter API",
    description="Learning management platform for Vietnamese English tutoring",
    version="0.1.0"
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "message": "TTTEnglishCenter API is running"}


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "0.1.0"
    }
