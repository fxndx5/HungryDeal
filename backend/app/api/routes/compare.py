"""
app/api/routes/compare.py
--------------------------
Endpoint de comparación de precios de un restaurante.

GET /api/v1/compare/{restaurant_id}

Para un restaurante dado, consulta las 3 plataformas en paralelo,
normaliza los precios y devuelve la comparación ordenada con el ganador.

Caché: en producción los precios se cachean 15 minutos en PostgreSQL
(ver modelo PlatformPrice.expires_at). El adapter mock no usa caché.
"""

import logging
from fastapi import APIRouter, HTTPException, status

from app.adapters.mock import MockAdapter, _RESTAURANT_BY_ID
from app.schemas.search import ComparisonResponse, PlatformPriceSchema, RestaurantSchema
from app.services.price_comparator import PriceComparator
from app.services.price_normalizer import normalize_all

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["compare"])


# ---------------------------------------------------------------------------
# Dependency: comparador con adapters activos
# ---------------------------------------------------------------------------

def _get_comparator() -> PriceComparator:
    """
    Crea el PriceComparator con los adapters disponibles.
    En producción (Sprint 3) se sustituirán los MockAdapter por adapters reales.
    """
    return PriceComparator(adapters=[
        MockAdapter(platform="uber_eats"),
        MockAdapter(platform="glovo"),
        MockAdapter(platform="just_eat"),
    ])


# ---------------------------------------------------------------------------
# Helper: info del restaurante (mock → base de datos en producción)
# ---------------------------------------------------------------------------

async def _get_restaurant_info(restaurant_id: str) -> dict | None:
    """
    Obtiene los datos básicos del restaurante.

    En desarrollo: consulta el índice en memoria del mock.
    En producción: hará SELECT a la tabla restaurants de Supabase.
    """
    return _RESTAURANT_BY_ID.get(restaurant_id)


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
        "Incluye la plataforma ganadora (más barata) y el ahorro máximo."
    ),
)
async def compare_prices(restaurant_id: str) -> ComparisonResponse:
    """
    Compara el coste total de pedir en un restaurante en todas las plataformas.

    - Consulta todos los adapters en paralelo.
    - Si un adapter falla, devuelve available=False para esa plataforma
      (no rompe la respuesta entera — graceful degradation).
    - Normaliza los precios (total = product + delivery + service).
    - Determina el ganador y calcula el ahorro máximo.
    """
    # 1. Verificar que el restaurante existe
    restaurant_info = await _get_restaurant_info(restaurant_id)
    if not restaurant_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Restaurante '{restaurant_id}' no encontrado",
        )

    # 2. Obtener precios de todas las plataformas en paralelo
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

    # 3. Normalizar precios (recalcular totales, redondear)
    normalized = normalize_all(result.prices)

    # 4. Construir respuesta
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

    return ComparisonResponse(
        restaurant=restaurant,
        comparison=comparison,
        winner=result.winner,
        savings=result.savings,
    )
