"""
app/services/price_comparator.py
---------------------------------
Servicio central que orquesta los adapters de delivery.

Para una búsqueda o una comparación, consulta TODAS las plataformas en
paralelo usando asyncio.gather(), agrega los resultados y determina el
ganador (plataforma más barata disponible).

Diseño:
    - PriceComparator recibe una lista de DeliveryAdapter en el constructor.
    - En producción se inyectan los adapters reales (JustEatAdapter, etc.).
    - En desarrollo/tests se inyectan instancias de MockAdapter.
    - Si un adapter falla, su error se ignora (graceful degradation).

Uso típico:
    comparator = PriceComparator(adapters=[
        MockAdapter("uber_eats"),
        MockAdapter("glovo"),
        MockAdapter("just_eat"),
    ])

    # Búsqueda
    restaurants = await comparator.search("McDonald's", "Madrid")

    # Comparación de precios
    result = await comparator.compare("mcdonalds-gran-via-madrid", "McDonald's Gran Vía")
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

from app.adapters.base import DeliveryAdapter, PlatformPrice, RestaurantResult

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Dataclasses de resultado
# ---------------------------------------------------------------------------

@dataclass
class RestaurantGroup:
    """
    Restaurante agregado de todas las plataformas.
    Un mismo restaurante puede estar en varias plataformas; aquí se une.
    """
    id: str
    name: str
    address: Optional[str]
    city: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    image_url: Optional[str]
    platforms: list[str]          # plataformas donde está disponible


@dataclass
class ComparisonResult:
    """
    Resultado completo de comparación de precios para un restaurante.
    Contiene los precios de TODAS las plataformas (disponibles o no).
    """
    restaurant_id: str
    restaurant_name: str
    prices: list[PlatformPrice]   # una entrada por plataforma
    winner: Optional[str]         # plataforma más barata (None si ninguna disponible)
    savings: float                # ahorro vs la plataforma más cara (0.0 si solo una)


# ---------------------------------------------------------------------------
# Servicio
# ---------------------------------------------------------------------------

class PriceComparator:
    """
    Orquesta los adapters de delivery para búsquedas y comparaciones.

    Args:
        adapters: lista de adaptadores, uno por plataforma.
    """

    def __init__(self, adapters: list[DeliveryAdapter]) -> None:
        self._adapters = adapters

    # ------------------------------------------------------------------
    # Búsqueda
    # ------------------------------------------------------------------

    async def search(
        self,
        query: str,
        location: str = "",
    ) -> list[RestaurantGroup]:
        """
        Busca restaurantes en todas las plataformas en paralelo.

        Deduplica los resultados por id de restaurante y agrega las
        plataformas disponibles en un solo objeto RestaurantGroup.

        Args:
            query:    texto de búsqueda (nombre del restaurante)
            location: ciudad o dirección para filtrar

        Returns:
            Lista de RestaurantGroup únicos ordenados por nombre.
        """
        tasks = [adapter.search(query, location) for adapter in self._adapters]
        results_per_platform = await asyncio.gather(*tasks, return_exceptions=True)

        # Agrupar resultados por id de restaurante
        grouped: dict[str, RestaurantGroup] = {}

        for idx, results in enumerate(results_per_platform):
            if isinstance(results, Exception):
                platform_name = self._adapters[idx].PLATFORM_NAME
                logger.warning(
                    "Adapter '%s' falló en search: %s", platform_name, results
                )
                continue

            for r in results:
                if r.id not in grouped:
                    grouped[r.id] = RestaurantGroup(
                        id=r.id,
                        name=r.name,
                        address=r.address,
                        city=r.city,
                        latitude=r.latitude,
                        longitude=r.longitude,
                        image_url=r.image_url,
                        platforms=[],
                    )
                # Añadir plataforma si no estaba ya
                if r.platform not in grouped[r.id].platforms:
                    grouped[r.id].platforms.append(r.platform)

        return sorted(grouped.values(), key=lambda r: r.name)

    # ------------------------------------------------------------------
    # Comparación de precios
    # ------------------------------------------------------------------

    async def compare(
        self,
        restaurant_id: str,
        restaurant_name: str = "",
    ) -> ComparisonResult:
        """
        Obtiene y compara los precios de un restaurante en todas las plataformas.

        Usa safe_get_price() para que si un adapter falla, devuelva
        available=False en vez de propagar la excepción (graceful degradation).

        Args:
            restaurant_id:   slug único del restaurante
            restaurant_name: nombre legible (solo para el resultado)

        Returns:
            ComparisonResult con precios de todas las plataformas,
            el ganador y el ahorro máximo.
        """
        tasks = [
            adapter.safe_get_price(restaurant_id)
            for adapter in self._adapters
        ]
        prices: list[PlatformPrice] = list(await asyncio.gather(*tasks))

        # Filtrar solo las disponibles para calcular ganador
        available = [p for p in prices if p.available]

        if not available:
            return ComparisonResult(
                restaurant_id=restaurant_id,
                restaurant_name=restaurant_name,
                prices=prices,
                winner=None,
                savings=0.0,
            )

        # Ordenar de más barata a más cara
        sorted_available = sorted(available, key=lambda p: p.total)
        cheapest = sorted_available[0]
        most_expensive = sorted_available[-1]

        # Ahorro = diferencia entre la más cara y la más barata
        savings = round(most_expensive.total - cheapest.total, 2)

        return ComparisonResult(
            restaurant_id=restaurant_id,
            restaurant_name=restaurant_name,
            prices=prices,
            winner=cheapest.platform,
            savings=savings,
        )
