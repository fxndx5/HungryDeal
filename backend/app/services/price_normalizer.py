"""
app/services/price_normalizer.py
----------------------------------
Normalizador de precios entre plataformas de delivery.

Cada plataforma tiene sus propias "trampas" de pricing que dificultan
la comparación directa:

  Glovo:
    - El precio del producto suele ser un 5–15% más alto que pedir directo.
    - Llaman al recargo "precio de plataforma" y lo esconden en el producto.
    - Factor documentado: ~1.10x sobre precio real del restaurante.

  Uber Eats:
    - Cobra "tarifa de servicio" variable (0–15% del subtotal).
    - En pedidos pequeños añade "small order fee" de ~0.99–2.99 €.
    - El precio del producto suele ser igual al del restaurante.

  Just Eat:
    - Precio del producto idéntico al del restaurante.
    - Tarifa de envío la fija el restaurante (puede ser 0 o hasta ~3 €).
    - Añade "tarifa de servicio" de ~0.50 € en algunos restaurantes.

El normalizador garantiza que:
  1. El total siempre sea coherente: product + delivery + service.
  2. Los precios estén redondeados a 2 decimales.
  3. Se apliquen las correcciones conocidas de cada plataforma.

Nota: las correcciones actuales son aproximaciones. Cuando tengamos
datos reales de scraping actualizaremos los factores.
"""

from dataclasses import replace
from app.adapters.base import PlatformPrice


# ---------------------------------------------------------------------------
# Factores de normalización por plataforma
# ---------------------------------------------------------------------------

# Glovo infla el precio del producto respecto al precio directo del restaurante.
# Factor aproximado basado en observación manual: ~10%.
# Cuando tengamos scraping real ajustaremos este valor por restaurante.
GLOVO_PRODUCT_INFLATION = 1.10

# Uber Eats: si el subtotal (product_price) es menor a este umbral,
# suele cobrar un "small order fee" adicional. Ya está incluido en service_fee
# de los datos reales, así que no se ajusta aquí.
UBER_EATS_SMALL_ORDER_THRESHOLD = 10.00


# ---------------------------------------------------------------------------
# Funciones públicas
# ---------------------------------------------------------------------------

def normalize(price: PlatformPrice) -> PlatformPrice:
    """
    Devuelve una copia normalizada del PlatformPrice.

    Pasos:
      1. Si no está disponible, devuelve sin cambios.
      2. Recalcula el total para garantizar coherencia.
      3. Redondea todos los valores a 2 decimales.

    No modifica el objeto original (inmutabilidad via dataclasses.replace).
    """
    if not price.available:
        return price

    product = round(price.product_price, 2)
    delivery = round(price.delivery_fee, 2)
    service = round(price.service_fee, 2)

    # Siempre recalcular el total para evitar inconsistencias
    total = round(product + delivery + service, 2)

    return replace(
        price,
        product_price=product,
        delivery_fee=delivery,
        service_fee=service,
        total=total,
    )


def normalize_all(prices: list[PlatformPrice]) -> list[PlatformPrice]:
    """
    Normaliza una lista de precios de todas las plataformas.
    Mantiene el mismo orden que la lista original.
    """
    return [normalize(p) for p in prices]


def get_adjusted_product_price(price: PlatformPrice) -> float:
    """
    Devuelve el precio del producto ajustado (sin inflación de plataforma).

    Útil para mostrar al usuario cuánto costaría el producto
    si lo comprara directamente vs en la plataforma.

    Actualmente solo ajusta Glovo. Las demás plataformas se asume
    que mantienen el precio real del restaurante.
    """
    if not price.available:
        return 0.0

    if price.platform == "glovo":
        # Estimar el precio real dividiendo por el factor de inflación
        return round(price.product_price / GLOVO_PRODUCT_INFLATION, 2)

    return round(price.product_price, 2)


def calculate_savings_breakdown(prices: list[PlatformPrice]) -> dict:
    """
    Calcula el desglose de ahorro entre plataformas disponibles.

    Returns:
        dict con:
          - cheapest: plataforma más barata
          - most_expensive: plataforma más cara
          - savings_total: ahorro en precio total
          - savings_delivery: ahorro solo en envío
          - savings_service: ahorro solo en tasas de servicio
    """
    available = [p for p in prices if p.available]
    if len(available) < 2:
        return {}

    sorted_by_total = sorted(available, key=lambda p: p.total)
    cheapest = sorted_by_total[0]
    most_expensive = sorted_by_total[-1]

    sorted_by_delivery = sorted(available, key=lambda p: p.delivery_fee)

    return {
        "cheapest": cheapest.platform,
        "most_expensive": most_expensive.platform,
        "savings_total": round(most_expensive.total - cheapest.total, 2),
        "savings_delivery": round(
            most_expensive.delivery_fee - sorted_by_delivery[0].delivery_fee, 2
        ),
        "savings_service": round(
            max(p.service_fee for p in available)
            - min(p.service_fee for p in available),
            2,
        ),
    }
