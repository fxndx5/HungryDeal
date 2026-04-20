# Backend - HungryDeal

API REST construida con **FastAPI** que gestiona la comparación de precios entre plataformas de delivery.

## Estructura

```
backend/
├── app/
│   ├── main.py              # Punto de entrada, configuración de CORS y routers
│   ├── api/
│   │   └── routes/          # Endpoints organizados por recurso
│   │       ├── auth.py      # Login, registro, refresh token
│   │       ├── search.py    # Búsqueda de restaurantes y platos
│   │       └── compare.py   # Comparación de precios entre plataformas
│   ├── adapters/            # Scrapers/clientes para cada plataforma
│   │   ├── ubereats.py
│   │   ├── glovo.py
│   │   └── justeat.py
│   ├── models/              # Modelos SQLAlchemy (tablas de la BD)
│   │   ├── user.py
│   │   └── search_history.py
│   ├── schemas/             # Esquemas Pydantic (request/response)
│   │   ├── user.py
│   │   └── price.py
│   ├── services/            # Lógica de negocio
│   │   ├── auth.py
│   │   └── price_comparator.py
│   └── core/                # Configuración global
│       ├── config.py        # Variables de entorno con pydantic-settings
│       ├── security.py      # Hashing de contraseñas, generación de JWT
│       └── database.py      # Sesión de SQLAlchemy
├── tests/                   # Tests con pytest
├── requirements.txt
└── Dockerfile
```

## Ejecución en desarrollo

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Ejemplo de adaptador esperado

```python
# app/adapters/ubereats.py
from playwright.async_api import async_playwright

class UberEatsAdapter:
    async def search(self, query: str, location: str) -> list[dict]:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            # ... scraping logic
            return results
```

## Tests

```bash
pytest
```
