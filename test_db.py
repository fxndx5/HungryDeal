import asyncio, asyncpg, os
from dotenv import load_dotenv
load_dotenv()

async def test():
    url = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')
    conn = await asyncpg.connect(url)
    rows = await conn.fetch("SELECT tablename FROM pg_tables WHERE schemaname='public'")
    print('Conectado! Tablas:', [r['tablename'] for r in rows])
    await conn.close()

asyncio.run(test())
