import asyncio
from typing import Optional

from app.adapters.base import DeliveryAdapter, PlatformPrice, RestaurantResult

_MOCK_RESTAURANTS: list[dict] = [
    {"id": "mcdonalds-gran-via-madrid", "name": "McDonald's Gran Vía", "address": "Gran Vía, 55", "city": "Madrid", "latitude": 40.4200, "longitude": -3.7025, "platform_id": "mcd-gran-via"},
    {"id": "mcdonalds-sol-madrid", "name": "McDonald's Sol", "address": "Puerta del Sol, 2", "city": "Madrid", "latitude": 40.4169, "longitude": -3.7035, "platform_id": "mcd-sol"},
    {"id": "kfc-callao-madrid", "name": "KFC Callao", "address": "Pl. del Callao, 3", "city": "Madrid", "latitude": 40.4215, "longitude": -3.7080, "platform_id": "kfc-callao"},
    {"id": "burger-king-castellana", "name": "Burger King Castellana", "address": "Paseo de la Castellana, 14", "city": "Madrid", "latitude": 40.4250, "longitude": -3.6920, "platform_id": "bk-castellana"},
    {"id": "pizza-hut-retiro", "name": "Pizza Hut Retiro", "address": "Calle de Alcalá, 70", "city": "Madrid", "latitude": 40.4190, "longitude": -3.6890, "platform_id": "pizza-hut-retiro"},
    {"id": "dominos-lavapies", "name": "Domino's Lavapiés", "address": "Calle de Embajadores, 25", "city": "Madrid", "latitude": 40.4090, "longitude": -3.7030, "platform_id": "dominos-lavapies"},
]

_MOCK_PRICES: dict[str, dict[str, dict]] = {
    "mcdonalds-gran-via-madrid": {
        "uber_eats": {"product_price": 8.99, "delivery_fee": 2.49, "service_fee": 0.99, "total": 12.47, "url": "https://www.ubereats.com/es"},
        "glovo":     {"product_price": 9.50, "delivery_fee": 1.99, "service_fee": 0.50, "total": 11.99, "url": "https://glovoapp.com/es/es/madrid/"},
        "just_eat":  {"product_price": 8.99, "delivery_fee": 0.99, "service_fee": 0.50, "total": 10.48, "url": "https://www.just-eat.es"},
    },
    "mcdonalds-sol-madrid": {
        "uber_eats": {"product_price": 8.99, "delivery_fee": 1.99, "service_fee": 0.99, "total": 11.97, "url": "https://www.ubereats.com/es"},
        "glovo":     {"product_price": 9.50, "delivery_fee": 1.49, "service_fee": 0.50, "total": 11.49, "url": "https://glovoapp.com/es/es/madrid/"},
    },
    "kfc-callao-madrid": {
        "uber_eats": {"product_price": 7.99, "delivery_fee": 2.49, "service_fee": 0.99, "total": 11.47, "url": "https://www.ubereats.com/es"},
        "just_eat":  {"product_price": 7.99, "delivery_fee": 1.49, "service_fee": 0.50, "total": 9.98,  "url": "https://www.just-eat.es"},
    },
    "burger-king-castellana": {
        "glovo":    {"product_price": 8.50, "delivery_fee": 1.99, "service_fee": 0.50, "total": 10.99, "url": "https://glovoapp.com/es/es/madrid/"},
        "just_eat": {"product_price": 8.50, "delivery_fee": 0.99, "service_fee": 0.50, "total": 9.99,  "url": "https://www.just-eat.es"},
    },
    "pizza-hut-retiro": {
        "uber_eats": {"product_price": 11.99, "delivery_fee": 2.99, "service_fee": 0.99, "total": 15.97, "url": "https://www.ubereats.com/es"},
        "glovo":     {"product_price": 12.50, "delivery_fee": 1.99, "service_fee": 0.50, "total": 14.99, "url": "https://glovoapp.com/es/es/madrid/"},
        "just_eat":  {"product_price": 11.99, "delivery_fee": 1.49, "service_fee": 0.50, "total": 13.98, "url": "https://www.just-eat.es"},
    },
    "dominos-lavapies": {
        "uber_eats": {"product_price": 10.99, "delivery_fee": 1.99, "service_fee": 0.99, "total": 13.97, "url": "https://www.ubereats.com/es"},
        "just_eat":  {"product_price": 10.99, "delivery_fee": 0.99, "service_fee": 0.50, "total": 12.48, "url": "https://www.just-eat.es"},
    },
}

_RESTAURANT_BY_ID: dict[str, dict] = {r["id"]: r for r in _MOCK_RESTAURANTS}


class MockAdapter(DeliveryAdapter):
    PLATFORM_NAME: str = "mock"

    def __init__(self, platform: str = "mock", delay_ms: int = 0) -> None:
        self.PLATFORM_NAME = platform
        self._delay = delay_ms / 1000.0

    async def search(self, query: str, location: str = "") -> list[RestaurantResult]:
        if self._delay:
            await asyncio.sleep(self._delay)

        q = query.lower()
        results = []
        for r in _MOCK_RESTAURANTS:
            if q not in r["name"].lower():
                continue
            if self.PLATFORM_NAME not in _MOCK_PRICES.get(r["id"], {}):
                continue
            results.append(RestaurantResult(
                id=r["id"], name=r["name"], platform=self.PLATFORM_NAME,
                address=r.get("address"), city=r.get("city"),
                latitude=r.get("latitude"), longitude=r.get("longitude"),
                platform_restaurant_id=r.get("platform_id"),
            ))
        return results

    async def get_price(self, restaurant_id: str, item_id: Optional[str] = None) -> PlatformPrice:
        if self._delay:
            await asyncio.sleep(self._delay)

        prices = _MOCK_PRICES.get(restaurant_id)
        if prices is None:
            raise KeyError(f"Restaurante '{restaurant_id}' no encontrado")

        data = prices.get(self.PLATFORM_NAME)
        if data is None:
            raise KeyError(f"'{restaurant_id}' no disponible en {self.PLATFORM_NAME}")

        return PlatformPrice(
            platform=self.PLATFORM_NAME,
            product_price=data["product_price"],
            delivery_fee=data["delivery_fee"],
            service_fee=data["service_fee"],
            total=data["total"],
            url=data["url"],
            available=True,
        )
