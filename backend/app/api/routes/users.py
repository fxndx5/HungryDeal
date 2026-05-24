"""
app/api/routes/users.py
------------------------
Endpoints del perfil y actividad del usuario autenticado.

PUT /api/v1/users/me          →  UserOut   (editar nombre/apellido)
GET /api/v1/users/me/history  →  HistoryResponse

Todos los endpoints requieren token JWT válido (Bearer).
"""

from decimal import Decimal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct

from app.core.database import get_db
from app.models.search_history import SearchHistory
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.history import HistoryItemSchema, HistoryResponse, UserStatsSchema
from app.schemas.auth import UserOut, UserUpdate
from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.put(
    "/me",
    response_model=UserOut,
    summary="Actualizar nombre y apellido del usuario",
    description="Permite editar first_name y last_name. El email no se puede cambiar.",
)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    """
    Actualiza los campos editables del perfil.
    Solo se modifican los campos que se envían (None = no tocar).
    """
    if body.first_name is not None:
        current_user.first_name = body.first_name.strip() or None
    if body.last_name is not None:
        current_user.last_name = body.last_name.strip() or None

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.get(
    "/me/history",
    response_model=HistoryResponse,
    summary="Historial de comparaciones del usuario",
    description=(
        "Devuelve las últimas comparaciones realizadas por el usuario autenticado, "
        "con el nombre del restaurante, la plataforma ganadora y el ahorro obtenido. "
        "Incluye estadísticas agregadas: total de comparaciones, ahorro acumulado "
        "y número de restaurantes únicos comparados."
    ),
)
async def get_my_history(
    limit: int = Query(default=50, le=100, ge=1, description="Máximo de entradas a devolver"),
    offset: int = Query(default=0, ge=0, description="Desplazamiento para paginación"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HistoryResponse:
    """
    Historial paginado de comparaciones.

    - JOIN con restaurants para obtener el nombre.
    - Stats calculadas en una segunda query (agregación).
    - Ordenado por searched_at DESC (más reciente primero).
    """

    # ── 1. Historial paginado con nombre del restaurante ──────────────────────
    history_q = (
        select(
            SearchHistory,
            Restaurant.name.label("restaurant_name"),
        )
        .outerjoin(Restaurant, SearchHistory.restaurant_id == Restaurant.id)
        .where(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.searched_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = (await db.execute(history_q)).all()

    items = [
        HistoryItemSchema(
            id=row.SearchHistory.id,
            query=row.SearchHistory.query,
            restaurant_id=row.SearchHistory.restaurant_id,
            restaurant_name=row.restaurant_name,
            platform_chosen=row.SearchHistory.platform_chosen,
            savings=float(row.SearchHistory.savings) if row.SearchHistory.savings is not None else None,
            searched_at=row.SearchHistory.searched_at,
        )
        for row in rows
    ]

    # ── 2. Stats agregadas (toda la historia, no solo la página actual) ───────
    stats_q = select(
        func.count(SearchHistory.id).label("total_comparisons"),
        func.coalesce(func.sum(SearchHistory.savings), Decimal("0")).label("total_savings"),
        func.count(distinct(SearchHistory.restaurant_id)).label("unique_restaurants"),
    ).where(SearchHistory.user_id == current_user.id)

    stats_row = (await db.execute(stats_q)).one()

    stats = UserStatsSchema(
        total_comparisons=stats_row.total_comparisons,
        total_savings=float(stats_row.total_savings),
        unique_restaurants=stats_row.unique_restaurants,
    )

    # ── 3. Total de registros (para paginación) ───────────────────────────────
    count_q = select(func.count(SearchHistory.id)).where(
        SearchHistory.user_id == current_user.id
    )
    total = (await db.execute(count_q)).scalar_one()

    return HistoryResponse(items=items, stats=stats, total=total)
