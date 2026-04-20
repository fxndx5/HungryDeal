import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, DECIMAL, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    query: Mapped[str | None] = mapped_column(String(255))
    restaurant_id: Mapped[str | None] = mapped_column(
        String(100), ForeignKey("restaurants.id", ondelete="SET NULL")
    )
    platform_chosen: Mapped[str | None] = mapped_column(String(50))
    savings: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2))
    searched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relaciones
    user: Mapped["User"] = relationship("User")  # noqa: F821
    restaurant: Mapped["Restaurant | None"] = relationship("Restaurant")  # noqa: F821

    __table_args__ = (
        Index("idx_search_history_user", "user_id", "searched_at"),
    )

    def __repr__(self) -> str:
        return f"<SearchHistory user={self.user_id} query={self.query}>"
