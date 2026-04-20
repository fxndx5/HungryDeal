from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PlatformPrice:
    """Precio normalizado de una plataforma para un restaurante/item."""
    platform: str           # "uber_eats" | "glovo" | "just_eat"
    product_price: float    # precio del producto
    delivery_fee: float     # coste de envío
    service_fee: float      # tarifa de servicio
    total: float            # precio final real = product + delivery + service
    url: str                # enlace directo al pedido
    available: bool = True  # si el restaurante está disponible ahora
    error: Optional[str] = field(default=None, repr=False)

    def __post_init__(self):
        # Calcula el total si no se proporcionó
        if self.total == 0 and self.available:
            self.total = self.product_price + self.delivery_fee + self.service_fee


@dataclass
class RestaurantResult:
    """Resultado de búsqueda de un restaurante."""
    id: str           # slug único: "mcd-gran-via-madrid"
    name: str
    platform: str
    address: Optional[str] = None
    city: Optional[str] = None
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    platform_restaurant_id: Optional[str] = None  # ID interno de la plataforma


class DeliveryAdapter(ABC):
    """
    Clase base abstracta para adaptadores de plataformas de delivery.
    Cada plataforma (Uber Eats, Glovo, Just Eat) implementa esta interfaz.
    """

    PLATFORM_NAME: str = ""  # Sobrescribir en cada subclase

    @abstractmethod
    async def search(self, query: str, location: str) -> list[RestaurantResult]:
        """
        Busca restaurantes que coincidan con la query en una ubicación.

        Args:
            query: término de búsqueda, ej. "McDonald's"
            location: ciudad o dirección, ej. "Madrid"

        Returns:
            Lista de RestaurantResult normalizados
        """

    @abstractmethod
    async def get_price(
        self,
        restaurant_id: str,
        item_id: Optional[str] = None,
    ) -> PlatformPrice:
        """
        Obtiene el precio real de un ítem en esta plataforma.

        Args:
            restaurant_id: ID interno del restaurante en esta plataforma
            item_id: ID del producto específico (opcional)

        Returns:
            PlatformPrice con todos los costes desglosados
        """

    async def safe_get_price(
        self,
        restaurant_id: str,
        item_id: Optional[str] = None,
    ) -> PlatformPrice:
        """
        Wrapper seguro de get_price. Si falla devuelve un PlatformPrice
        con available=False en vez de propagar la excepción.
        """
        try:
            return await self.get_price(restaurant_id, item_id)
        except Exception as exc:
            return PlatformPrice(
                platform=self.PLATFORM_NAME,
                product_price=0.0,
                delivery_fee=0.0,
                service_fee=0.0,
                total=0.0,
                url="",
                available=False,
                error=str(exc),
            )
