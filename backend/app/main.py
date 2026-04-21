from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import engine, Base
import app.models  # noqa: F401

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            if settings.APP_ENV == "development":
                await conn.run_sync(Base.metadata.create_all)
        logger.info("Base de datos conectada")
    except Exception as exc:
        logger.warning("BD no disponible al arrancar: %s", exc)
    yield
    await engine.dispose()


app = FastAPI(
    title="HungryDeal API",
    description="Comparador de precios de delivery entre Uber Eats, Glovo y Just Eat.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routes.auth import router as auth_router
from app.api.routes.search import router as search_router
from app.api.routes.compare import router as compare_router

app.include_router(auth_router)
app.include_router(search_router)
app.include_router(compare_router)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": app.version, "env": settings.APP_ENV}
