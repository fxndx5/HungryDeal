# Normalización y comparación de precios entre plataformas

from dataclasses import replace
from app.adapters.base import PlatformPrice

# Glovo infla el precio del producto ~10% respecto al precio directo del restaurante
GLOVO_PRODUCT_INFLATION = 1.10

# Umbral para el small order fee de Uber Eats (ya incluido en service_fee de datos reales)
UBER_EATS_SMALL_ORDER_THRESHOLD = 10.00


def normalize(price: PlatformPrice) -> PlatformPrice:
    # Recalcula el total para garantizar coherencia y redondea a 2 decimales
    if not price.available:
        return price

    product = round(price.product_price, 2)
    delivery = round(price.delivery_fee, 2)
    service = round(price.service_fee, 2)
    total = round(product + delivery + service, 2)

    return replace(
        price,
        product_price=product,
        delivery_fee=delivery,
        service_fee=service,
        total=total,
    )


def normalize_all(prices: list[PlatformPrice]) -> list[PlatformPrice]:
    return [normalize(p) for p in prices]


def get_adjusted_product_price(price: PlatformPrice) -> float:
    # Devuelve el precio del producto sin la inflación de plataforma (útil solo para Glovo)
    if not price.available:
        return 0.0

    if price.platform == "glovo":
        return round(price.product_price / GLOVO_PRODUCT_INFLATION, 2)

    return round(price.product_price, 2)


def calculate_savings_breakdown(prices: list[PlatformPrice]) -> dict:
    # Desglose de ahorro: plataforma más barata vs más cara, por total, envío y tasas
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
