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

_optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    if not credentials:
        return None
    user_id = decode_access_token(credentials.credentials)
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


def _get_comparator() -> PriceComparator:
    # uber y glovo son mock de momento
    return PriceComparator(adapters=[
        MockAdapter(platform="uber_eats"),
        MockAdapter(platform="glovo"),
        JustEatAdapter(),
    ])


async def _get_restaurant_info(restaurant_id: str) -> dict | None:
    return _RESTAURANT_BY_ID.get(restaurant_id)


def _cache_key(restaurant_id: str) -> str:
    return f"compare:{restaurant_id}"


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
    # Flujo: verificar restaurante → caché → adapters → normalizar → guardar historial
    restaurant_info = await _get_restaurant_info(restaurant_id)
    if not restaurant_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Restaurante '{restaurant_id}' no encontrado",
        )

    cache_key = _cache_key(restaurant_id)
    cached = await cache.get(cache_key)

    if cached is not None:
        logger.debug("Cache HIT para '%s'", restaurant_id)
        response = ComparisonResponse(**cached)
    else:
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

        normalized = normalize_all(result.prices)

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

        comparison.sort(key=lambda p: (not p.available, p.total if p.available else 999))

        response = ComparisonResponse(
            restaurant=restaurant,
            comparison=comparison,
            winner=result.winner,
            savings=result.savings,
        )

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

    if current_user is not None:
        try:
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
