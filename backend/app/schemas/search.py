"""
app/schemas/search.py
----------------------
Schemas Pydantic para los endpoints de búsqueda y comparación.

Estos schemas definen la estructura exacta de los JSON que devuelve la API.
El frontend TypeScript (shared/types/index.ts) refleja estos mismos tipos.

Si cambias un campo aquí, actualiza también frontend/shared/types/index.ts.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Restaurante
# ---------------------------------------------------------------------------

class RestaurantSchema(BaseModel):
    """Datos básicos de un restaurante para la lista de resultados."""

    id: str = Field(description="Slug único: 'mcdonalds-gran-via-madrid'")
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    platforms: list[str] = Field(
        default_factory=list,
        description="Plataformas donde está disponible: ['uber_eats', 'glovo', 'just_eat']",
    )
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ---------------------------------------------------------------------------
# Precios por plataforma
# ---------------------------------------------------------------------------

class PlatformPriceSchema(BaseModel):
    """
    Precio de un restaurante en UNA plataforma de delivery.
    Incluye TODOS los costes para hacer la comparación real.
    """

    platform: str = Field(description="'uber_eats' | 'glovo' | 'just_eat'")
    product_price: float = Field(description="Precio del producto en la plataforma")
    delivery_fee: float = Field(description="Coste de envío")
    service_fee: float = Field(description="Tarifa de servicio (la que suelen esconder)")
    total: float = Field(description="Total real = product + delivery + service")
    available: bool = Field(description="¿Está el restaurante disponible ahora mismo?")
    redirect_url: Optional[str] = Field(
        default=None,
        description="Enlace directo para hacer el pedido en la plataforma",
    )
    error: Optional[str] = Field(
        default=None,
        description="Mensaje de error si available=False",
    )


# ---------------------------------------------------------------------------
# Respuestas de la API
# ---------------------------------------------------------------------------

class SearchResponse(BaseModel):
    """
    Respuesta de GET /api/v1/search?q=...
    Lista de restaurantes que coinciden con la búsqueda.
    """

    results: list[RestaurantSchema]
    total: int = Field(description="Número total de resultados")
    query: str = Field(description="La query que se buscó")


class ComparisonResponse(BaseModel):
    """
    Respuesta de GET /api/v1/compare/{restaurant_id}
    Comparación de precios del restaurante en todas las plataformas.
    """

    restaurant: RestaurantSchema
    comparison: list[PlatformPriceSchema] = Field(
        description="Una entrada por plataforma, incluyendo las no disponibles",
    )
    winner: Optional[str] = Field(
        default=None,
        description="Plataforma más barata. None si ninguna disponible.",
    )
    savings: float = Field(
        default=0.0,
        description="Ahorro máximo en € entre la plataforma más cara y la más barata",
    )
