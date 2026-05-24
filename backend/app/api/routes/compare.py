"""
app/api/routes/compare.py
--------------------------
Endpoint de comparación de precios de un restaurante.

GET /api/v1/compare/{restaurant_id}

Para un restaurante dado, consulta las 3 plataformas en paralelo,
normaliza los precios y devuelve la comparación ordenada con el ganador.

Caché: los precios se cachean 15 minutos en Redis (CACHE_TTL_SECONDS en Settings).
La clave es "compare:{restaurant_id}". Si Redis no está disponible, la app
sigue funcionando sin caché (graceful degradation).
"""

import logging
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.mock import MockAdapter, _RESTAURANT_BY_ID
from app.adapters.justeat import JustEatAdapter
from app.schemas.search import ComparisonResponse, PlatformPriceSchema, RestaurantSchema
from app.services.price_comparator import PriceComparator
from app.services.price_normalizer import normalize_all
from app.core.database import get_db
from app.core.cache import cache
from app.core.config import get_settings
from app.models.search_history import SearchHistory
from app.models.user import User
from app.services.auth import decode_access_token
from sqlalchemy import select

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/api/v1", tags=["compare"])

# ── Dependencia de usuario OPCIONAL (no lanza 401 si no hay token) ──────────

_optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Resuelve el usuario autenticado SI se envía token válido.
    Si no hay token o es inválido, devuelve None (no lanza error).
    Permite que /compare funcione tanto para anónimos como para registrados.
    """
    if not credentials:
        return None
    user_id = decode_access_token(credentials.credentials)
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Dependency: comparador con adapters activos
# ---------------------------------------------------------------------------

def _get_comparator() -> PriceComparator:
    """
    Crea el PriceComparator con los adapters activos.

    - just_eat  → JustEatAdapter real (llama a api.just-eat.es)
    - uber_eats → MockAdapter (adapter real pendiente)
    - glovo     → MockAdapter (adapter real pendiente)

    Si JustEatAdapter falla en runtime, safe_get_price() del base adapter
    captura el error y devuelve available=False sin romper la comparación.
    """
    return PriceComparator(adapters=[
        MockAdapter(platform="uber_eats"),
        MockAdapter(platform="glovo"),
        JustEatAdapter(),               # ← adapter real de Just Eat ES
    ])


# Helper: info del restaurante

async def _get_restaurant_info(restaurant_id: str) -> dict | None:
    """
    Obtiene los datos básicos del restaurante.

    En desarrollo: consulta el índice en memoria del mock.
    En producción: hará SELECT a la tabla restaurants de Supabase.
    """
    return _RESTAURANT_BY_ID.get(restaurant_id)


# Helper: clave de caché para un restaurante

def _cache_key(restaurant_id: str) -> str:
    return f"compare:{restaurant_id}"


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/compare/{restaurant_id}",
    response_model=ComparisonResponse,
    summary="Comparar precios de un restaurante en todas las plataformas",
    description=(
        "Devuelve el precio total desglosado (producto + envío + tasas) "
        "de un restaurante en Uber Eats, Glovo y Just Eat. "
        "Los precios se normalizan para que la comparación sea justa. "
        "Incluye la plataforma ganadora (más barata) y el ahorro máximo. "
        "Los resultados se cachean 15 minutos en Redis."
    ),
)
async def compare_prices(
    restaurant_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> ComparisonResponse:
    """
    Compara el coste total de pedir en un restaurante en todas las plataformas.

    Flujo:
    1. Verificar que el restaurante existe.
    2. Intentar leer resultado desde caché Redis (TTL 15 min).
    3. Si no hay caché: consultar adapters en paralelo, normalizar, guardar en Redis.
    4. Si hay usuario autenticado: guardar en search_history.
    """
    # 1. Verificar que el restaurante existe
    restaurant_info = await _get_restaurant_info(restaurant_id)
    if not restaurant_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Restaurante '{restaurant_id}' no encontrado",
        )

    # 2. Intentar leer desde caché Redis
    cache_key = _cache_key(restaurant_id)
    cached = await cache.get(cache_key)

    if cached is not None:
        logger.debug("Cache HIT para '%s'", restaurant_id)
        response = ComparisonResponse(**cached)
    else:
        # 3. Cache MISS → llamar a los adapters
        logger.debug("Cache MISS para '%s', consultando adapters", restaurant_id)

        comparator = _get_comparator()
        try:
            result = await comparator.compare(
                restaurant_id=restaurant_id,
                restaurant_name=restaurant_info["name"],
            )
        except Exception as exc:
            logger.exception("Error al comparar precios para '%s'", restaurant_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al obtener los precios. Inténtalo de nuevo.",
            ) from exc

        # Normalizar precios (recalcular totales, redondear)
        normalized = normalize_all(result.prices)

        # Construir respuesta
        restaurant = RestaurantSchema(
            id=restaurant_id,
            name=restaurant_info["name"],
            address=restaurant_info.get("address"),
            city=restaurant_info.get("city"),
            latitude=restaurant_info.get("latitude"),
            longitude=restaurant_info.get("longitude"),
            platforms=[p.platform for p in normalized if p.available],
        )

        comparison = [
            PlatformPriceSchema(
                platform=p.platform,
                product_price=p.product_price,
                delivery_fee=p.delivery_fee,
                service_fee=p.service_fee,
                total=p.total,
                available=p.available,
                redirect_url=p.url if p.available else None,
                error=p.error,
            )
            for p in normalized
        ]

        # Ordenar: primero disponibles (por precio), luego no disponibles
        comparison.sort(key=lambda p: (not p.available, p.total if p.available else 999))

        response = ComparisonResponse(
            restaurant=restaurant,
            comparison=comparison,
            winner=result.winner,
            savings=result.savings,
        )

        # Guardar en caché Redis (falla silenciosamente si Redis no está)
        saved = await cache.set(
            cache_key,
            response.model_dump(),
            ttl=settings.CACHE_TTL_SECONDS,
        )
        if saved:
            logger.debug(
                "Comparación cacheada para '%s', TTL %ds",
                restaurant_id,
                settings.CACHE_TTL_SECONDS,
            )

    # 4. Guardar en historial si hay usuario autenticado
    if current_user is not None:
        try:
            # Extraer winner y savings de la respuesta (viene de caché o fresca)
            winner = response.winner
            savings_val = response.savings
            entry = SearchHistory(
                user_id=current_user.id,
                query=restaurant_info.get("name"),
                restaurant_id=restaurant_id,
                platform_chosen=winner,
                savings=Decimal(str(round(savings_val, 2))) if savings_val else None,
            )
            db.add(entry)
            await db.commit()
        except Exception:
            logger.warning(
                "No se pudo guardar en search_history para user=%s", current_user.id
            )
            await db.rollback()

    return response
