from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PlatformPrice:
    # Precio normalizado de una plataforma para un restaurante
    platform: str           # "uber_eats" | "glovo" | "just_eat"
    product_price: float
    delivery_fee: float
    service_fee: float
    total: float            # precio final = product + delivery + service
    url: str
    available: bool = True
    error: Optional[str] = field(default=None, repr=False)

    def __post_init__(self):
        if self.total == 0 and self.available:
            self.total = self.product_price + self.delivery_fee + self.service_fee


@dataclass
class RestaurantResult:
    # Resultado de búsqueda de un restaurante en una plataforma concreta
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
    # Interfaz común para todos los adapters de plataformas de delivery

    PLATFORM_NAME: str = ""

    @abstractmethod
    async def search(self, query: str, location: str) -> list[RestaurantResult]:
        pass

    @abstractmethod
    async def get_price(
        self,
        restaurant_id: str,
        item_id: Optional[str] = None,
    ) -> PlatformPrice:
        pass

    async def safe_get_price(
        self,
        restaurant_id: str,
        item_id: Optional[str] = None,
    ) -> PlatformPrice:
        # Wrapper que captura cualquier excepción y devuelve available=False
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
