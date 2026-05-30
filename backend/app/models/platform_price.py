import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy import String, Text, DECIMAL, DateTime, Boolean, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

PLATFORM_VALUES = ("uber_eats", "glovo", "just_eat")


class PlatformPrice(Base):
    __tablename__ = "platform_prices"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    restaurant_id: Mapped[str | None] = mapped_column(
        String(100), ForeignKey("restaurants.id", ondelete="CASCADE"), index=True
    )
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    product_price: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2))
    delivery_fee: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2))
    service_fee: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2))
    total: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2))
    available: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    redirect_url: Mapped[str | None] = mapped_column(Text)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(minutes=15),
    )

    # Relaciones
    restaurant: Mapped["Restaurant"] = relationship(  # noqa: F821
        "Restaurant", back_populates="prices"
    )

    __table_args__ = (
        Index(
            "idx_platform_prices_restaurant_platform",
            "restaurant_id", "platform", "expires_at",
        ),
    )

    @property
    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at

    def __repr__(self) -> str:
        return f"<PlatformPrice restaurant={self.restaurant_id} platform={self.platform} total={self.total}>"
