# HungryDeal

Aplicación multiplataforma que compara precios de delivery entre **Uber Eats**, **Glovo** y **Just Eat**, mostrando el precio real total (producto + envío + tasas) para que el usuario elija la opción más barata.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic, Playwright |
| Frontend Web | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Frontend Móvil | React Native, Expo, TypeScript |
| Base de Datos | PostgreSQL 16 |
| Contenedores | Docker, Docker Compose |
| Autenticación | JWT |

## Requisitos previos

- Docker y Docker Compose
- Python 3.12+
- Node.js 20+
- npm o yarn

## Levantar el proyecto en local

### 1. Clonar el repositorio y configurar variables de entorno

```bash
git clone <url-del-repo>
cd Hungrydeal-code
cp .env.example .env
# Editar .env con tus valores reales
```

### 2. Levantar con Docker Compose

```bash
docker compose up --build
```

Esto levantará:
- **PostgreSQL** en el puerto 5432
- **Backend (FastAPI)** en el puerto 8000
- **Frontend Web (Next.js)** en el puerto 3000

### 3. Levantar sin Docker (desarrollo)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend Web:**
```bash
cd frontend/web
npm install
npm run dev
```

**Frontend Móvil:**
```bash
cd frontend/mobile
npm install
npx expo start
```

## Estructura de carpetas

```
Hungrydeal-code/
├── backend/                  # API REST con FastAPI
│   ├── app/
│   │   ├── api/routes/       # Endpoints de la API
│   │   ├── adapters/         # Adaptadores para Uber Eats, Glovo, Just Eat
│   │   ├── models/           # Modelos SQLAlchemy (ORM)
│   │   ├── schemas/          # Esquemas Pydantic (validación)
│   │   ├── services/         # Lógica de negocio
│   │   ├── core/             # Configuración, seguridad, dependencias
│   │   └── main.py           # Punto de entrada de FastAPI
│   ├── tests/                # Tests del backend
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── web/                  # Aplicación Next.js 14
│   ├── mobile/               # Aplicación React Native + Expo
│   └── shared/               # Código compartido entre web y móvil
│       ├── api/              # Clientes HTTP compartidos
│       └── types/            # Tipos TypeScript compartidos
├── database/
│   └── migrations/           # Scripts SQL y migraciones manuales
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Documentación de la API

Con el backend corriendo, accede a la documentación interactiva:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Licencia

Este proyecto es privado y de uso interno.
