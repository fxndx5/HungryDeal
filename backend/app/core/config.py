from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ─────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8081"

    # ── Base de datos (Supabase / PostgreSQL) ────────────────────────
    DATABASE_URL: str  # postgresql+asyncpg://...

    # ── JWT ──────────────────────────────────────────────────────────
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_DAYS: int = 30

    # ── Supabase ─────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""

    # ── Redis (caché opcional) ────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
