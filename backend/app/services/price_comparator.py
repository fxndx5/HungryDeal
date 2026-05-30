import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

from app.adapters.base import DeliveryAdapter, PlatformPrice

logger = logging.getLogger(__name__)


@dataclass
class RestaurantGroup:
    id: str
    name: str
    address: Optional[str]
    city: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    image_url: Optional[str]
    platforms: list[str]


@dataclass
class ComparisonResult:
    restaurant_id: str
    restaurant_name: str
    prices: list[PlatformPrice]
    winner: Optional[str]
    savings: float


class PriceComparator:
    def __init__(self, adapters: list[DeliveryAdapter]) -> None:
        self._adapters = adapters

    async def search(self, query: str, location: str = "") -> list[RestaurantGroup]:
        tasks = [adapter.search(query, location) for adapter in self._adapters]
        results_per_platform = await asyncio.gather(*tasks, return_exceptions=True)

        grouped: dict[str, RestaurantGroup] = {}

        for idx, results in enumerate(results_per_platform):
            if isinstance(results, Exception):
                logger.warning("Adapter '%s' fallo: %s", self._adapters[idx].PLATFORM_NAME, results)
                continue
            for r in results:
                if r.id not in grouped:
                    grouped[r.id] = RestaurantGroup(
                        id=r.id, name=r.name, address=r.address, city=r.city,
                        latitude=r.latitude, longitude=r.longitude,
                        image_url=r.image_url, platforms=[],
                    )
                if r.platform not in grouped[r.id].platforms:
                    grouped[r.id].platforms.append(r.platform)

        return sorted(grouped.values(), key=lambda r: r.name)

    async def compare(self, restaurant_id: str, restaurant_name: str = "") -> ComparisonResult:
        tasks = [adapter.safe_get_price(restaurant_id) for adapter in self._adapters]
        prices: list[PlatformPrice] = list(await asyncio.gather(*tasks))

        available = [p for p in prices if p.available]

        if not available:
            return ComparisonResult(
                restaurant_id=restaurant_id, restaurant_name=restaurant_name,
                prices=prices, winner=None, savings=0.0,
            )

        sorted_available = sorted(available, key=lambda p: p.total)
        savings = round(sorted_available[-1].total - sorted_available[0].total, 2)

        return ComparisonResult(
            restaurant_id=restaurant_id, restaurant_name=restaurant_name,
            prices=prices, winner=sorted_available[0].platform, savings=savings,
        )
