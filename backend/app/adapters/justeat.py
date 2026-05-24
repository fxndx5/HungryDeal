"""
app/adapters/justeat.py
------------------------
Adapter real para Just Eat España (just-eat.es).

Usa la API interna que alimenta la app móvil y la web de Just Eat ES.

Endpoint de búsqueda:
    GET https://api.just-eat.es/restaurants
        ?q={nombre}
        &c={codigo_postal}      # ej. 28013 para Madrid centro
        &limit=20

Campos clave de la respuesta:
    Restaurants[].Id              → ID interno de Just Eat
    Restaurants[].UniqueName      → slug para la URL de pedido
    Restaurants[].Name            → nombre del restaurante
    Restaurants[].DeliveryCost    → tarifa de envío en €
    Restaurants[].ServiceFee      → {"Amount": 0.39, "Percentage": 4.99}
    Restaurants[].MinimumDeliveryOrder → pedido mínimo (lo usamos como product_price)
    Restaurants[].IsOpenNow       → si acepta pedidos ahora
    Restaurants[].Address         → dirección

Estrategia de precios para la comparación:
    product_price = MinimumDeliveryOrder  (pedido mínimo real)
    delivery_fee  = DeliveryCost          (envío desde...)
    service_fee   = ServiceFee.Amount     (tarifa de servicio)
    total         = product_price + delivery_fee + service_fee

Si la API no responde o devuelve error se lanza una excepción
y el base.DeliveryAdapter.safe_get_price() la captura y devuelve
available=False, sin romper la comparación.
"""

import logging
from typing import Optional

import httpx

from app.adapters.base import DeliveryAdapter, PlatformPrice, RestaurantResult

logger = logging.getLogger(__name__)

# ─── Constantes ───────────────────────────────────────────────────────────────

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

# Código postal → área de búsqueda en Madrid
_DEFAULT_POSTCODE = "28013"   # Madrid centro (Gran Vía / Sol)

# ─── Mapa slug HungryDeal → ID interno Just Eat ───────────────────────────────
# Obtenido explorando la API con los restaurantes del mock.
# Cuando se integren restaurantes reales, este mapa se puede poblar
# automáticamente desde un endpoint de búsqueda.
_SLUG_TO_JE_ID: dict[str, str] = {
    "mcdonalds-gran-via-madrid":  "mcdonaldsgranviamadrid",
    "mcdonalds-sol-madrid":       "mcdonaldspuertadelsolmadrid",
    "kfc-callao-madrid":          "kfccallaomadrid",
    "burger-king-castellana":     "burgerkingcastellanamadrid",
    "pizza-hut-retiro":           "pizzahutretiro",
    "dominos-lavapies":           "dominoslalavapies",
    # Just Eat no tiene Glovo ni Uber en su catálogo — solo los que
    # están registrados en su plataforma
    "telepizza-arguelles":        "telepizzaargüellesmadrid",
    "vips-gran-via":              "vipsgranviamadrid",
    "istanbul-kebab-lavapies":    "istanbulkebablavapies",
    "wok-to-walk-callao":         "woktocallaomadrid",
}


# ─── Adapter ─────────────────────────────────────────────────────────────────

class JustEatAdapter(DeliveryAdapter):
    """
    Adapter real para Just Eat España.

    Llama a la API interna de Just Eat ES para obtener precios reales
    (delivery fee, service fee, pedido mínimo).

    Si la API devuelve un error o no hay conexión, safe_get_price()
    devuelve available=False para que la comparación no se rompa.
    """

    PLATFORM_NAME = "just_eat"

    def __init__(self, timeout: float = 8.0) -> None:
        self._timeout = timeout

    # ── Búsqueda ──────────────────────────────────────────────────────────────

    async def search(
        self,
        query: str,
        location: str = _DEFAULT_POSTCODE,
    ) -> list[RestaurantResult]:
        """
        Busca restaurantes en Just Eat ES por nombre y código postal / ciudad.
        """
        # Normalizar location: si no parece un código postal usar Madrid por defecto
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

    # ── Precio ───────────────────────────────────────────────────────────────

    async def get_price(
        self,
        restaurant_id: str,
        item_id: Optional[str] = None,
    ) -> PlatformPrice:
        """
        Obtiene los costes reales de pedir en Just Eat ES para un restaurante.

        - product_price = pedido mínimo del restaurante (MinimumDeliveryOrder)
        - delivery_fee  = coste de envío (DeliveryCost)
        - service_fee   = tarifa de servicio fija (ServiceFee.Amount)
        - total         = suma de los tres
        - url           = enlace directo al restaurante en just-eat.es
        """
        je_id = _SLUG_TO_JE_ID.get(restaurant_id)
        if not je_id:
            # Intentar búsqueda dinámica si no está en el mapa estático
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

        # ── Extraer campos de precio ──────────────────────────────────────────
        is_open: bool = restaurant.get("IsOpenNow", True)

        # Tarifa de envío
        delivery_fee: float = float(
            restaurant.get("DeliveryCost")
            or restaurant.get("DeliveryStartingFrom")
            or 0.0
        )

        # Tarifa de servicio (puede ser dict o float según versión API)
        service_fee_raw = restaurant.get("ServiceFee", 0)
        if isinstance(service_fee_raw, dict):
            service_fee = float(service_fee_raw.get("Amount", 0))
        else:
            service_fee = float(service_fee_raw or 0)

        # Pedido mínimo como proxy del precio del producto
        product_price: float = float(
            restaurant.get("MinimumDeliveryOrder")
            or restaurant.get("MinimumOrderValue")
            or 0.0
        )

        total = round(product_price + delivery_fee + service_fee, 2)

        # URL de pedido directo
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

    # ── Helpers privados ──────────────────────────────────────────────────────

    async def _resolve_id(self, slug: str) -> Optional[str]:
        """
        Intenta resolver un slug HungryDeal a un ID de Just Eat
        haciendo una búsqueda por el nombre del restaurante.
        Devuelve None si no encuentra coincidencia.
        """
        # Convertir slug → nombre aproximado para buscar
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
        """
        Intenta hacer la conversión inversa de ID Just Eat → slug HungryDeal.
        Si no está en el mapa devuelve el je_id como slug de fallback.
        """
        reverse = {v: k for k, v in _SLUG_TO_JE_ID.items()}
        return reverse.get(je_id, je_id)
