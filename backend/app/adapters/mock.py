"""
app/adapters/mock.py
--------------------
Adaptador mock para desarrollo y testing.

Implementa DeliveryAdapter con datos estáticos realistas de restaurantes de Madrid.
No hace peticiones externas — útil para desarrollar el frontend y testear servicios
sin depender de APIs reales ni de Playwright.

Uso:
    from app.adapters.mock import MockAdapter

    adapter = MockAdapter(platform="just_eat")
    results = await adapter.search("McDonald's", "Madrid")
    price   = await adapter.get_price("mcdonalds-gran-via-madrid")
"""

import asyncio
from typing import Optional

from app.adapters.base import DeliveryAdapter, PlatformPrice, RestaurantResult


# ---------------------------------------------------------------------------
# Datos estáticos
# ---------------------------------------------------------------------------

_MOCK_RESTAURANTS: list[dict] = [
    {
        "id": "mcdonalds-gran-via-madrid",
        "name": "McDonald's Gran Vía",
        "address": "Gran Vía, 55",
        "city": "Madrid",
        "latitude": 40.4200,
        "longitude": -3.7025,
        "platform_id": "mcd-gran-via",
    },
    {
        "id": "mcdonalds-sol-madrid",
        "name": "McDonald's Sol",
        "address": "Puerta del Sol, 2",
        "city": "Madrid",
        "latitude": 40.4169,
        "longitude": -3.7035,
        "platform_id": "mcd-sol",
    },
    {
        "id": "kfc-callao-madrid",
        "name": "KFC Callao",
        "address": "Pl. del Callao, 3",
        "city": "Madrid",
        "latitude": 40.4215,
        "longitude": -3.7080,
        "platform_id": "kfc-callao",
    },
    {
        "id": "burger-king-castellana",
        "name": "Burger King Castellana",
        "address": "Paseo de la Castellana, 14",
        "city": "Madrid",
        "latitude": 40.4250,
        "longitude": -3.6920,
        "platform_id": "bk-castellana",
    },
    {
        "id": "pizza-hut-retiro",
        "name": "Pizza Hut Retiro",
        "address": "Calle de Alcalá, 70",
        "city": "Madrid",
        "latitude": 40.4190,
        "longitude": -3.6890,
        "platform_id": "pizza-hut-retiro",
    },
    {
        "id": "dominos-lavapies",
        "name": "Domino's Lavapiés",
        "address": "Calle de Embajadores, 25",
        "city": "Madrid",
        "latitude": 40.4090,
        "longitude": -3.7030,
        "platform_id": "dominos-lavapies",
    },
]

# Precios por restaurante y plataforma.
# Nota: los totales son exactamente product_price + delivery_fee + service_fee.
# Glovo infla product_price (~10%), Uber Eats cobra service_fee variable,
# Just Eat tiene delivery más barato.
_MOCK_PRICES: dict[str, dict[str, dict]] = {
    "mcdonalds-gran-via-madrid": {
        "uber_eats": {
            "product_price": 8.99, "delivery_fee": 2.49, "service_fee": 0.99,
            "total": 12.47, "url": "https://www.ubereats.com/es",
        },
        "glovo": {
            "product_price": 9.50, "delivery_fee": 1.99, "service_fee": 0.50,
            "total": 11.99, "url": "https://glovoapp.com/es/es/madrid/",
        },
        "just_eat": {
            "product_price": 8.99, "delivery_fee": 0.99, "service_fee": 0.50,
            "total": 10.48, "url": "https://www.just-eat.es",
        },
    },
    "mcdonalds-sol-madrid": {
        "uber_eats": {
            "product_price": 8.99, "delivery_fee": 1.99, "service_fee": 0.99,
            "total": 11.97, "url": "https://www.ubereats.com/es",
        },
        "glovo": {
            "product_price": 9.50, "delivery_fee": 1.49, "service_fee": 0.50,
            "total": 11.49, "url": "https://glovoapp.com/es/es/madrid/",
        },
        # just_eat no disponible en este local
    },
    "kfc-callao-madrid": {
        "uber_eats": {
            "product_price": 7.99, "delivery_fee": 2.49, "service_fee": 0.99,
            "total": 11.47, "url": "https://www.ubereats.com/es",
        },
        "just_eat": {
            "product_price": 7.99, "delivery_fee": 1.49, "service_fee": 0.50,
            "total": 9.98, "url": "https://www.just-eat.es",
        },
        # glovo no disponible en este local
    },
    "burger-king-castellana": {
        "glovo": {
            "product_price": 8.50, "delivery_fee": 1.99, "service_fee": 0.50,
            "total": 10.99, "url": "https://glovoapp.com/es/es/madrid/",
        },
        "just_eat": {
            "product_price": 8.50, "delivery_fee": 0.99, "service_fee": 0.50,
            "total": 9.99, "url": "https://www.just-eat.es",
        },
        # uber_eats no disponible en este local
    },
    "pizza-hut-retiro": {
        "uber_eats": {
            "product_price": 11.99, "delivery_fee": 2.99, "service_fee": 0.99,
            "total": 15.97, "url": "https://www.ubereats.com/es",
        },
        "glovo": {
            "product_price": 12.50, "delivery_fee": 1.99, "service_fee": 0.50,
            "total": 14.99, "url": "https://glovoapp.com/es/es/madrid/",
        },
        "just_eat": {
            "product_price": 11.99, "delivery_fee": 1.49, "service_fee": 0.50,
            "total": 13.98, "url": "https://www.just-eat.es",
        },
    },
    "dominos-lavapies": {
        "uber_eats": {
            "product_price": 10.99, "delivery_fee": 1.99, "service_fee": 0.99,
            "total": 13.97, "url": "https://www.ubereats.com/es",
        },
        "just_eat": {
            "product_price": 10.99, "delivery_fee": 0.99, "service_fee": 0.50,
            "total": 12.48, "url": "https://www.just-eat.es",
        },
        # glovo no disponible en este local
    },
}


# Índice por id para búsquedas rápidas
_RESTAURANT_BY_ID: dict[str, dict] = {r["id"]: r for r in _MOCK_RESTAURANTS}


# ---------------------------------------------------------------------------
# Adaptador
# ---------------------------------------------------------------------------

class MockAdapter(DeliveryAdapter):
    """
    Adaptador mock que simula una plataforma de delivery real.

    Diseñado para que cada instancia simule UNA plataforma específica
    (uber_eats, glovo o just_eat). El PriceComparator crea tres instancias,
    una por plataforma.

    Args:
        platform: nombre de la plataforma que simula
        delay_ms: latencia artificial en ms (0 en tests, ~100 en desarrollo)
    """

    PLATFORM_NAME: str = "mock"

    def __init__(self, platform: str = "mock", delay_ms: int = 0) -> None:
        self.PLATFORM_NAME = platform
        self._delay = delay_ms / 1000.0

    # ------------------------------------------------------------------
    # Métodos abstractos obligatorios
    # ------------------------------------------------------------------

    async def search(self, query: str, location: str = "") -> list[RestaurantResult]:
        """
        Busca restaurantes cuyo nombre contenga `query`.
        Solo devuelve restaurantes que tengan precio en `self.PLATFORM_NAME`.
        """
        if self._delay:
            await asyncio.sleep(self._delay)

        query_lower = query.lower()
        results: list[RestaurantResult] = []

        for restaurant in _MOCK_RESTAURANTS:
            # Filtrar por nombre
            if query_lower not in restaurant["name"].lower():
                continue
            # Filtrar por disponibilidad en esta plataforma
            prices = _MOCK_PRICES.get(restaurant["id"], {})
            if self.PLATFORM_NAME not in prices:
                continue

            results.append(
                RestaurantResult(
                    id=restaurant["id"],
                    name=restaurant["name"],
                    platform=self.PLATFORM_NAME,
                    address=restaurant.get("address"),
                    city=restaurant.get("city"),
                    latitude=restaurant.get("latitude"),
                    longitude=restaurant.get("longitude"),
                    platform_restaurant_id=restaurant.get("platform_id"),
                )
            )

        return results

    async def get_price(
        self,
        restaurant_id: str,
        item_id: Optional[str] = None,
    ) -> PlatformPrice:
        """
        Devuelve el precio del restaurante en esta plataforma.
        Si el restaurante no tiene datos para esta plataforma, lanza KeyError
        (el método `safe_get_price` de la clase base lo captura).
        """
        if self._delay:
            await asyncio.sleep(self._delay)

        prices = _MOCK_PRICES.get(restaurant_id)
        if prices is None:
            raise KeyError(f"Restaurante '{restaurant_id}' no existe en datos mock")

        platform_data = prices.get(self.PLATFORM_NAME)
        if platform_data is None:
            raise KeyError(
                f"'{restaurant_id}' no disponible en {self.PLATFORM_NAME}"
            )

        return PlatformPrice(
            platform=self.PLATFORM_NAME,
            product_price=platform_data["product_price"],
            delivery_fee=platform_data["delivery_fee"],
            service_fee=platform_data["service_fee"],
            total=platform_data["total"],
            url=platform_data["url"],
            available=True,
        )
