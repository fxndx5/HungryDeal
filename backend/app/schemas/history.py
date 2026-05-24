"""
app/schemas/history.py
-----------------------
Schemas Pydantic para el historial de búsquedas del usuario.

GET /api/v1/users/me/history  →  HistoryResponse
"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class HistoryItemSchema(BaseModel):
    """Una entrada del historial de comparaciones."""

    id: uuid.UUID
    query: Optional[str] = None
    restaurant_id: Optional[str] = None
    restaurant_name: Optional[str] = None   # JOIN con tabla restaurants
    platform_chosen: Optional[str] = None   # plataforma más barata en ese momento
    savings: Optional[float] = None         # cuánto se ahorró
    searched_at: datetime

    model_config = {"from_attributes": True}


class UserStatsSchema(BaseModel):
    """Estadísticas de uso del usuario."""

    total_comparisons: int = 0
    total_savings: float = 0.0
    unique_restaurants: int = 0


class HistoryResponse(BaseModel):
    """Respuesta completa del endpoint de historial."""

    items: list[HistoryItemSchema]
    stats: UserStatsSchema
    total: int
