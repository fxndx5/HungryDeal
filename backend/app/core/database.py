"""
app/core/database.py
---------------------
Configuracion del motor SQLAlchemy async para Supabase / PostgreSQL.

IMPORTANTE — Supabase connection pooler (puerto 6543):
  El pooler usa PgBouncer en modo transaction, que NO soporta prepared
  statements. Si no se desactivan, SQLAlchemy lanza errores del tipo:
    "prepared statement 'SQLALCHEMY_...' does not exist"
  Solucion: statement_cache_size=0 en connect_args.

  Puerto 5432 = conexion directa a Postgres (max 15 conexiones en free tier).
  Puerto 6543 = pooler transaction mode (recomendado para apps web, ilimitado).
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Motor async
# ---------------------------------------------------------------------------

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,     # reciclar conexiones cada 5 min
    # Supabase transaction pooler (6543) no soporta prepared statements
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Dependency de FastAPI
# ---------------------------------------------------------------------------

async def get_db():
    """
    Dependency que inyecta una sesion de BD en cada endpoint.

    Hace commit automatico si el endpoint termina sin excepciones.
    Hace rollback si hay cualquier error.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
