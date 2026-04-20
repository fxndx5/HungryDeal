"""
app/main.py
-----------
Punto de entrada de la API de HungryDeal.

Registra todos los routers con su prefijo y tags correspondientes.
Configura CORS, lifespan (conexión a BD) y middleware global.

Endpoints disponibles:
  GET  /health                          — estado del servicio
  POST /api/v1/auth/register            — registro de usuario
  POST /api/v1/auth/login               — login, devuelve JWT
  GET  /api/v1/auth/me                  — datos del usuario autenticado
  GET  /api/v1/search?q=...&city=...    — buscar restaurantes
  GET  /api/v1/compare/{restaurant_id}  — comparar precios de un restaurante
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import engine, Base
import app.models  # noqa: F401 — registrar todos los modelos en Base.metadata

settings = get_settings()


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: en desarrollo intentamos crear tablas si no existen.
    # Si la BD no está disponible (ej. sin red), el servidor arranca igual
    # y solo fallará en endpoints que usen la BD directamente.
    import logging
    logger = logging.getLogger(__name__)
    try:
        async with engine.begin() as conn:
            if settings.APP_ENV == "development":
                await conn.run_sync(Base.metadata.create_all)
        logger.info("Conexion a base de datos OK")
    except Exception as exc:
        logger.warning("No se pudo conectar a la BD al arrancar: %s", exc)
        logger.warning("El servidor arranca igualmente. Los endpoints de busqueda/comparacion funcionan sin BD (usan MockAdapter).")
    yield
    # Shutdown: liberar pool de conexiones
    await engine.dispose()


# ---------------------------------------------------------------------------
# Aplicación FastAPI
# ---------------------------------------------------------------------------

app = FastAPI(
    title="HungryDeal API",
    description=(
        "Comparador de precios de delivery entre Uber Eats, Glovo y Just Eat. "
        "Devuelve el precio total (producto + envío + tasas) de cada plataforma "
        "para que el usuario pueda elegir la más barata."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — permitir peticiones desde el frontend web y móvil
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

from app.api.routes.auth import router as auth_router
from app.api.routes.search import router as search_router
from app.api.routes.compare import router as compare_router

app.include_router(auth_router)
app.include_router(search_router)
app.include_router(compare_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"], summary="Estado del servicio")
async def health_check():
    """
    Endpoint de salud para load balancers y monitorización.
    Devuelve el estado del servidor, versión y entorno.
    """
    return {
        "status": "ok",
        "version": app.version,
        "env": settings.APP_ENV,
    }
