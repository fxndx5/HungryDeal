from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Text, DECIMAL, DateTime, ARRAY, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)  # slug
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100), index=True)
    latitude: Mapped[Decimal | None] = mapped_column(DECIMAL(9, 6))
    longitude: Mapped[Decimal | None] = mapped_column(DECIMAL(9, 6))
    platforms: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    image_url: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relaciones
    prices: Mapped[list["PlatformPrice"]] = relationship(  # noqa: F821
        "PlatformPrice", back_populates="restaurant", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Restaurant id={self.id} name={self.name}>"
