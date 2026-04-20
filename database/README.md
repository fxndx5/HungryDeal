# Base de Datos - HungryDeal

Configuración y migraciones de **PostgreSQL 16**.

## Estructura

```
database/
└── migrations/       # Scripts SQL manuales y de referencia
    ├── 001_init.sql  # Creación inicial de tablas
    └── ...
```

## Gestión de migraciones

Las migraciones principales se gestionan con **Alembic** desde el backend:

```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "crear tablas iniciales"
alembic upgrade head
```

La carpeta `migrations/` de aquí se reserva para scripts SQL manuales de referencia o seeds de datos.

## Esquema esperado

```sql
-- Tabla de usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historial de búsquedas
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query TEXT NOT NULL,
    location TEXT,
    results JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Restaurantes cacheados
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    location TEXT,
    cached_at TIMESTAMP DEFAULT NOW()
);
```

## Conexión

La conexión se configura mediante la variable `DATABASE_URL` en el archivo `.env`:

```
DATABASE_URL=postgresql+asyncpg://hungrydeal:password@localhost:5432/hungrydeal
```
