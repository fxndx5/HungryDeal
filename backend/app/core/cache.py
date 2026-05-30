# Cliente Redis async para caché de precios

import json
import logging
from typing import Any, Optional

from redis.asyncio import Redis, ConnectionError as RedisConnectionError

logger = logging.getLogger(__name__)

_KEY_PREFIX = "hd:"


class RedisCache:
    # Si Redis no está disponible, available=False y los métodos devuelven None/False sin propagar excepción

    def __init__(self) -> None:
        self._client: Optional[Redis] = None
        self.available: bool = False

    async def connect(self, url: str) -> None:
        # Llamar desde el lifespan de FastAPI
        try:
            self._client = Redis.from_url(
                url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2,
            )
            await self._client.ping()
            self.available = True
            logger.info("Redis conectado. URL: %s", url)
        except Exception as exc:
            self.available = False
            logger.warning(
                "Redis no disponible (%s). La app funcionará sin caché.", exc
            )

    async def disconnect(self) -> None:
        if self._client:
            await self._client.aclose()
            self.available = False
            logger.info("Redis desconectado")

    async def get(self, key: str) -> Optional[Any]:
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
        if not self.available or not self._client:
            return
        try:
            await self._client.delete(_KEY_PREFIX + key)
        except Exception as exc:
            logger.debug("Redis DEL error para '%s': %s", key, exc)

    async def invalidate_compare(self, restaurant_id: str) -> None:
        await self.delete(f"compare:{restaurant_id}")


# Instancia global, se inicializa en lifespan de main.py
cache = RedisCache()
