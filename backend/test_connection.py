import os
from dotenv import load_dotenv

load_dotenv()

print("📊 DATABASE_URL from .env:")
print(os.getenv("DATABASE_URL"))
print()

import asyncio
from sqlalchemy import select, text
from app.database import AsyncSessionLocal
from app.models import Teacher

async def test_connection():
    """Test database connection and query teachers"""
    
    async with AsyncSessionLocal() as session:
        # Test raw SQL
        result = await session.execute(text("SELECT version()"))
        version = result.scalar()
        print(f"✅ Connected to PostgreSQL")
        print(f"   Version: {version}\n")
        
        # Test SQLAlchemy model
        result = await session.execute(
            select(Teacher).where(Teacher.is_active == True)
        )
        teachers = result.scalars().all()
        
        print(f"📚 Teachers in database: {len(teachers)}")
        for teacher in teachers:
            print(f"  - {teacher.full_name} ({teacher.email})")
            print(f"    Role: {teacher.role}")
            print(f"    Specializations: {teacher.specializations}")
            print()

if __name__ == "__main__":
    asyncio.run(test_connection())