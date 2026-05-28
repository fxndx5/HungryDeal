# Endpoint GET /api/v1/search — búsqueda de restaurantes en todas las plataformas

import logging
from fastapi import APIRouter, Query, HTTPException, status

from app.adapters.mock import MockAdapter
from app.schemas.search import SearchResponse, RestaurantSchema
from app.services.price_comparator import PriceComparator, RestaurantGroup

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["search"])


def _get_comparator() -> PriceComparator:
    return PriceComparator(adapters=[
        MockAdapter(platform="uber_eats"),
        MockAdapter(platform="glovo"),
        MockAdapter(platform="just_eat"),
    ])


def _to_schema(group: RestaurantGroup) -> RestaurantSchema:
    return RestaurantSchema(
        id=group.id,
        name=group.name,
        address=group.address,
        city=group.city,
        latitude=group.latitude,
        longitude=group.longitude,
        image_url=group.image_url,
        platforms=group.platforms,
    )


@router.get(
    "/search",
    response_model=SearchResponse,
    summary="Buscar restaurantes por nombre",
    description=(
        "Busca restaurantes que coincidan con `q` en todas las plataformas "
        "de delivery. Los resultados se deduplicán por restaurante y se "
        "agrega la lista de plataformas donde está disponible."
    ),
)
async def search_restaurants(
    q: str = Query(
        ...,
        min_length=1,
        max_length=100,
        description="Nombre del restaurante a buscar",
        examples={"default": {"value": "McDonald's"}},
    ),
    city: str = Query(
        default="Madrid",
        description="Ciudad donde buscar (filtra resultados por ubicación)",
        examples={"default": {"value": "Madrid"}},
    ),
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Número máximo de resultados a devolver",
    ),
) -> SearchResponse:
    comparator = _get_comparator()

    try:
        groups = await comparator.search(query=q, location=city)
    except Exception as exc:
        logger.exception("Error en búsqueda: q=%s city=%s", q, city)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al realizar la búsqueda. Inténtalo de nuevo.",
        ) from exc

    results = [_to_schema(g) for g in groups[:limit]]

    return SearchResponse(
        results=results,
        total=len(results),
        query=q,
    )
