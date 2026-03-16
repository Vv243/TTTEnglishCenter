from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment
_raw_url = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres_dev_password@localhost:5432/tttenglish_dev"
)
# Fix URL for asyncpg: replace postgresql:// with postgresql+asyncpg://
# and remove sslmode parameter (asyncpg uses ssl=True instead)
import re
DATABASE_URL = _raw_url
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
# Remove sslmode and channel_binding params (not supported by asyncpg)
DATABASE_URL = re.sub(r"[?&]sslmode=[^&]*", "", DATABASE_URL)
DATABASE_URL = re.sub(r"[?&]channel_binding=[^&]*", "", DATABASE_URL)
# Clean up trailing ? if all params removed
DATABASE_URL = DATABASE_URL.rstrip("?")

# Create async engine
# Use SSL for production (Neon requires it)
_use_ssl = "neon.tech" in DATABASE_URL
engine = create_async_engine(
    DATABASE_URL,
    connect_args={"ssl": True} if _use_ssl else {},
    echo=True,  # Log SQL queries in development
    future=True,
    poolclass=NullPool,  # Disable connection pooling for development
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Dependency for FastAPI routes
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()