# Adapter para la API interna de Just Eat España

import logging
from typing import Optional

import httpx

from app.adapters.base import DeliveryAdapter, PlatformPrice, RestaurantResult

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.just-eat.es"

_HEADERS = {
    "Accept": "application/json",
    "Accept-Language": "es-ES,es;q=0.9",
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
    ),
    "x-je-app-id": "just-eat-es",
    "x-je-platform": "web",
}

_DEFAULT_POSTCODE = "28013"   # Madrid centro (Gran Vía / Sol)

# Mapa slug HungryDeal → ID interno Just Eat, obtenido explorando la API
_SLUG_TO_JE_ID: dict[str, str] = {
    "mcdonalds-gran-via-madrid":  "mcdonaldsgranviamadrid",
    "mcdonalds-sol-madrid":       "mcdonaldspuertadelsolmadrid",
    "kfc-callao-madrid":          "kfccallaomadrid",
    "burger-king-castellana":     "burgerkingcastellanamadrid",
    "pizza-hut-retiro":           "pizzahutretiro",
    "dominos-lavapies":           "dominoslalavapies",
    "telepizza-arguelles":        "telepizzaargüellesmadrid",
    "vips-gran-via":              "vipsgranviamadrid",
    "istanbul-kebab-lavapies":    "istanbulkebablavapies",
    "wok-to-walk-callao":         "woktocallaomadrid",
}


class JustEatAdapter(DeliveryAdapter):
    # Adapter real para Just Eat España. Si la API falla, safe_get_price() devuelve available=False.

    PLATFORM_NAME = "just_eat"

    def __init__(self, timeout: float = 8.0) -> None:
        self._timeout = timeout

    async def search(
        self,
        query: str,
        location: str = _DEFAULT_POSTCODE,
    ) -> list[RestaurantResult]:
        # Si location no es un código postal numérico, usar Madrid por defecto
        postcode = location if location.isdigit() else _DEFAULT_POSTCODE

        async with httpx.AsyncClient(
            headers=_HEADERS,
            timeout=self._timeout,
            follow_redirects=True,
        ) as client:
            resp = await client.get(
                f"{_BASE_URL}/restaurants",
                params={"q": query, "c": postcode, "limit": 20},
            )
            resp.raise_for_status()
            data = resp.json()

        restaurants = data.get("Restaurants", [])
        results: list[RestaurantResult] = []

        for r in restaurants:
            slug = self._je_id_to_slug(r.get("Id", ""))
            results.append(RestaurantResult(
                id=slug,
                name=r.get("Name", ""),
                platform=self.PLATFORM_NAME,
                address=r.get("Address", {}).get("FirstLine") if isinstance(r.get("Address"), dict) else r.get("Address"),
                city=r.get("City", "Madrid"),
                platform_restaurant_id=r.get("Id"),
            ))

        return results

    async def get_price(
        self,
        restaurant_id: str,
        item_id: Optional[str] = None,
    ) -> PlatformPrice:
        # product_price = pedido mínimo, delivery_fee = coste envío, service_fee = tarifa fija
        je_id = _SLUG_TO_JE_ID.get(restaurant_id)
        if not je_id:
            je_id = await self._resolve_id(restaurant_id)
            if not je_id:
                raise ValueError(
                    f"No se encontró '{restaurant_id}' en Just Eat. "
                    "Añadir al mapa _SLUG_TO_JE_ID o implementar resolución automática."
                )

        async with httpx.AsyncClient(
            headers=_HEADERS,
            timeout=self._timeout,
            follow_redirects=True,
        ) as client:
            resp = await client.get(f"{_BASE_URL}/restaurants/{je_id}")

            if resp.status_code == 404:
                raise ValueError(f"Restaurante '{je_id}' no encontrado en Just Eat")
            resp.raise_for_status()
            data = resp.json()

        restaurant = data.get("Restaurant", data)

        is_open: bool = restaurant.get("IsOpenNow", True)

        delivery_fee: float = float(
            restaurant.get("DeliveryCost")
            or restaurant.get("DeliveryStartingFrom")
            or 0.0
        )

        service_fee_raw = restaurant.get("ServiceFee", 0)
        if isinstance(service_fee_raw, dict):
            service_fee = float(service_fee_raw.get("Amount", 0))
        else:
            service_fee = float(service_fee_raw or 0)

        product_price: float = float(
            restaurant.get("MinimumDeliveryOrder")
            or restaurant.get("MinimumOrderValue")
            or 0.0
        )

        total = round(product_price + delivery_fee + service_fee, 2)

        unique_name: str = (
            restaurant.get("UniqueName")
            or restaurant.get("Url", "")
            or je_id
        )
        url = f"https://www.just-eat.es/restaurantes/{unique_name}/menu"

        return PlatformPrice(
            platform=self.PLATFORM_NAME,
            product_price=product_price,
            delivery_fee=delivery_fee,
            service_fee=service_fee,
            total=total,
            url=url,
            available=is_open,
            error=None if is_open else "El restaurante no está abierto ahora mismo",
        )

    async def _resolve_id(self, slug: str) -> Optional[str]:
        # Búsqueda dinámica por nombre cuando el slug no está en el mapa estático
        name_query = slug.replace("-", " ").replace("madrid", "").strip()
        try:
            results = await self.search(name_query)
            if results:
                return results[0].platform_restaurant_id
        except Exception:
            pass
        return None

    @staticmethod
    def _je_id_to_slug(je_id: str) -> str:
        reverse = {v: k for k, v in _SLUG_TO_JE_ID.items()}
        return reverse.get(je_id, je_id)
