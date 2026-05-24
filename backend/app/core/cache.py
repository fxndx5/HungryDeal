"""
app/core/cache.py
------------------
Cliente Redis async para caché de precios.

Uso:
    from app.core.cache import cache

    # Guardar (TTL en segundos)
    await cache.set("price:mcdonalds-gran-via-madrid", data_json, ttl=900)

    # Leer (devuelve None si no existe o expiró)
    data = await cache.get("price:mcdonalds-gran-via-madrid")

El cliente se inicializa en el lifespan de main.py y se cierra al apagar.
Si Redis no está disponible, las operaciones fallan silenciosamente
(cache.available = False); la app sigue funcionando sin caché.
"""

import json
import logging
from typing import Any, Optional

from redis.asyncio import Redis, ConnectionError as RedisConnectionError

logger = logging.getLogger(__name__)

# Prefijo para todas las claves de HungryDeal
_KEY_PREFIX = "hd:"


class RedisCache:
    """
    Wrapper sobre redis.asyncio.Redis con manejo de errores silencioso.

    Si Redis no está disponible, available=False y todos los métodos
    devuelven None/False sin propagar la excepción.
    Esto garantiza que la app funciona correctamente aunque Redis caiga.
    """

    def __init__(self) -> None:
        self._client: Optional[Redis] = None
        self.available: bool = False

    async def connect(self, url: str) -> None:
        """Establece la conexión con Redis. Llamar desde lifespan de FastAPI."""
        try:
            self._client = Redis.from_url(
                url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            # Verificar conexión real
            await self._client.ping()
            self.available = True
            logger.info("Redis conectado. URL: %s", url)
        except Exception as exc:
            self.available = False
            logger.warning(
                "Redis no disponible (%s). La app funcionará sin caché.", exc
            )

    async def disconnect(self) -> None:
        """Cierra la conexión. Llamar al apagar FastAPI."""
        if self._client:
            await self._client.aclose()
            self.available = False
            logger.info("Redis desconectado")

    # ── Operaciones principales ───────────────────────────────────────────────

    async def get(self, key: str) -> Optional[Any]:
        """
        Obtiene un valor de la caché.
        Devuelve el objeto Python deserializado o None (miss / error).
        """
        if not self.available or not self._client:
            return None
        try:
            raw = await self._client.get(_KEY_PREFIX + key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.debug("Redis GET error para '%s': %s", key, exc)
            return None

    async def set(self, key: str, value: Any, ttl: int = 900) -> bool:
        """
        Guarda un valor en caché con TTL en segundos.
        Devuelve True si se guardó, False si falló.
        """
        if not self.available or not self._client:
            return False
        try:
            serialized = json.dumps(value, ensure_ascii=False)
            await self._client.set(_KEY_PREFIX + key, serialized, ex=ttl)
            return True
        except Exception as exc:
            logger.debug("Redis SET error para '%s': %s", key, exc)
            return False

    async def delete(self, key: str) -> None:
        """Elimina una clave de la caché."""
        if not self.available or not self._client:
            return
        try:
            await self._client.delete(_KEY_PREFIX + key)
        except Exception as exc:
            logger.debug("Redis DEL error para '%s': %s", key, exc)

    async def invalidate_compare(self, restaurant_id: str) -> None:
        """Invalida la caché de comparación de un restaurante concreto."""
        await self.delete(f"compare:{restaurant_id}")


# Instancia global, se inicializa en lifespan de main.py
cache = RedisCache()
