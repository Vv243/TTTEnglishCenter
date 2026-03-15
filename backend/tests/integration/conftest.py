"""
Test configuration and fixtures for EduCore API integration tests.
Uses the actual dev database with transaction rollback after each test.
"""
import pytest
import pytest_asyncio
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

# ── Test DB (same dev DB, rolled back after each test) ───────────────────────
TEST_DATABASE_URL = (
    "postgresql+asyncpg://postgres:postgres_dev_password@localhost:5433/tttenglish_dev"
)

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=NullPool,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session():
    """Each test gets a fresh session that rolls back on completion."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    """HTTP test client with DB dependency overridden."""
    from app.main import app
    from app.database import get_db

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        follow_redirects=True,
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_token(client):
    """Get admin JWT token."""
    resp = await client.post("/api/v1/auth/login?username=admin&password=admin123")
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def teacher_token(client):
    """Get teacher JWT token (co_mai)."""
    resp = await client.post("/api/v1/auth/login?username=co_mai&password=teacher123")
    assert resp.status_code == 200
    return resp.json()["access_token"]


def auth(token):
    """Helper to create auth headers."""
    return {"Authorization": f"Bearer {token}"}