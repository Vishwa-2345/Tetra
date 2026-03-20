import asyncio
import sys
sys.path.insert(0, '.')

from app.core.database import engine, AsyncSessionLocal
from sqlalchemy import text

async def add_linkedin_column():
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'linkedin' not in columns:
                await session.execute(text("ALTER TABLE users ADD COLUMN linkedin VARCHAR(500)"))
                await session.commit()
                print("[OK] Added 'linkedin' column to users table")
            else:
                print("[OK] 'linkedin' column already exists")
        except Exception as e:
            print(f"Error: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(add_linkedin_column())
