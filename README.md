# HungryDeal

![HungryDeal logo](frontend/web/public/memoria/capturas/logo_hungrydeal.png)

Comparador de precios de delivery en tiempo real entre Uber Eats, Glovo y Just Eat.
Muestra el coste total real (producto + envío + tasas) para que el usuario elija la opción más barata.

**Repositorio:** https://github.com/fxndx5/HungryDeal  
**App en producción:** https://hungrydeal.netlify.app  
**API:** https://hungrydeal-api.onrender.com/docs

---

## Requisitos

- Python 3.12+
- Node.js 20+
- PostgreSQL 17 (o cuenta en Supabase)
- Redis (opcional, para caché)

---

## Instalación y ejecución

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # rellenar DATABASE_URL, SECRET_KEY, etc.
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva: http://localhost:8000/docs

### Frontend web

```bash
cd frontend/web
npm install
npm run dev
```

App disponible en: http://localhost:3000

### Con Docker Compose

```bash
docker compose up --build
```

Levanta PostgreSQL (5432), backend (8000) y frontend (3000).

### Base de datos

```bash
psql -U postgres -d hungrydeal -f database/hungrydeal_database.sql
```

---

## Estructura

```
Hungrydeal-code/
├── backend/                  # API REST — FastAPI + Python 3.12
│   └── app/
│       ├── adapters/         # Patrón Adapter: JustEatAdapter, MockAdapter
│       ├── api/routes/       # Endpoints: /auth, /search, /compare, /users
│       ├── core/             # Configuración, base de datos, caché Redis
│       ├── models/           # Modelos SQLAlchemy
│       ├── schemas/          # Schemas Pydantic
│       └── services/         # Lógica de negocio
├── frontend/web/             # Next.js 14 + TypeScript + Tailwind CSS
├── frontend/shared/          # Tipos y cliente HTTP compartidos
└── database/                 # Script SQL y migraciones
```
