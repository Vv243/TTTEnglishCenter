import asyncio
import asyncpg

async def test_direct():
    """Test asyncpg connection directly (no SQLAlchemy)"""
    
    print("Testing direct asyncpg connection...")
    print("Host: localhost")
    print("Port: 5433")  # ← Changed
    print("User: postgres")
    print("Password: postgres_dev_password")
    print("Database: tttenglish_dev")
    print()
    
    try:
        conn = await asyncpg.connect(
            host='localhost',
            port=5433,  # ← Changed
            user='postgres',
            password='postgres_dev_password',
            database='tttenglish_dev'
        )
        
        print("✅ Connection successful!")
        
        version = await conn.fetchval('SELECT version()')
        print(f"PostgreSQL version: {version[:50]}...")
        
        count = await conn.fetchval('SELECT COUNT(*) FROM teachers')
        print(f"Teachers in database: {count}")
        
        await conn.close()
        print("\n🎉 All tests passed!")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print(f"Error type: {type(e).__name__}")

if __name__ == "__main__":
    asyncio.run(test_direct())