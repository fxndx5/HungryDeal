

# 🍔 HungryDeal — Chuleta de Demo (Profesor)

> Stack: FastAPI + PostgreSQL (Supabase) + Redis + Next.js 14
> Todo en local salvo la BD, que corre en Supabase Cloud.

---

## 1. ARRANCAR EL PROYECTO

### Opción A — Docker (recomendada, un solo comando)

```bash
# Desde la raíz del proyecto (donde está docker-compose.yml)
docker compose up --build
```

Levanta automáticamente:
- **PostgreSQL** en localhost:5432
- **Redis** en localhost:6379
- **Backend FastAPI** en http://localhost:8000

> Si solo quieres Redis + backend sin PostgreSQL local (usas Supabase):
> ```bash
> docker compose up redis backend --build
> ```

---

### Opción B — Manual (si Docker da problemas)

**Terminal 1 — Redis:**
```bash
docker run -p 6379:6379 redis:7-alpine
```

**Terminal 2 — Backend:**
```bash
cd Hungrydeal-code/backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 — Frontend:**
```bash
cd Hungrydeal-code/frontend/web
npm install
npm run dev
```

---

## 2. VERIFICAR QUE TODO ESTÁ VIVO

```bash
# Backend vivo
curl http://localhost:8000/health
# → {"status":"ok","version":"0.1.0","env":"development"}

# Swagger UI (documentación interactiva)
# Abrir en el navegador:
http://localhost:8000/docs
```

Frontend:
```
http://localhost:3000
```

---

## 3. FLUJO DE DEMO (para el profesor)

### Paso 1 — Búsqueda sin login
- Ir a `http://localhost:3000`
- Buscar **"McDonald"** en el buscador
- Aparecen los restaurantes disponibles con sus plataformas

### Paso 2 — Comparación de precios
- Clic en un restaurante (ej. McDonald's Gran Vía)
- Se muestran los precios desglosados por plataforma:
  - Precio producto + Envío + Tarifa de servicio = **Total real**
  - Badge **"Más barato"** en el ganador
  - Botón **"Pedir aquí"** que redirige a Just Eat

### Paso 3 — Just Eat REAL vs Mocks
- Just Eat muestra datos **en tiempo real** de `api.just-eat.es`
- Glovo y Uber Eats usan datos mock (adapters pendientes de Sprint 4)
- Si Just Eat no responde → aparece "No disponible" sin romper la app

### Paso 4 — Registro y login
- Clic en **"Iniciar sesión"** → Crear cuenta con email y contraseña
- El token JWT se guarda y la navbar muestra el avatar con las iniciales

### Paso 5 — Perfil de usuario
- Clic en el avatar (esquina superior derecha) → **Mi perfil**
- Se ven las stats reales: comparaciones, ahorro total, restaurantes únicos
- Tab **Historial**: todas las comparaciones hechas con sesión activa
- Tab **Configuración**: editar nombre y apellido

### Paso 6 — Mapa de restaurantes cercanos
- Ir a **"Cerca"** en la navbar
- Mapa interactivo con los restaurantes del mock geolocalizados

---

## 4. ENDPOINTS API (para enseñar en Swagger)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado del servidor |
| GET | `/api/v1/search?q=McDonald` | Buscar restaurantes |
| GET | `/api/v1/compare/{id}` | Comparar precios (con caché Redis 15 min) |
| POST | `/api/v1/auth/register` | Registro de usuario |
| POST | `/api/v1/auth/login` | Login → devuelve JWT |
| GET | `/api/v1/auth/me` | Perfil del usuario autenticado |
| GET | `/api/v1/users/me/history` | Historial de comparaciones |
| PUT | `/api/v1/users/me` | Editar nombre/apellido |

---

## 5. TESTS (para demostrar en vivo)

```bash
cd Hungrydeal-code/backend

# Tests de integración (endpoints search y compare)
python test_integration.py

# Tests de auth completos (register, login, JWT, historial)
python test_auth.py

# Tests del adapter Just Eat (con y sin internet)
python test_justeat.py
```

Salida esperada:
```
  PASS  Servidor activo — versión 0.1.0 — env development
  PASS  Búsqueda OK — 2 resultados para 'McDonald'
  PASS  Sin resultados devuelve total=0 y lista vacía correctamente
  PASS  Query vacía rechazada con 422 correctamente
  PASS  Comparación OK — ganador: just_eat — ahorro: 2.50 €
  ...
  TODOS LOS TESTS DE INTEGRACIÓN PASARON ✓
```

---

## 6. CACHÉ REDIS — cómo demostrarlo

```bash
# Primera petición → Cache MISS (llama a Just Eat, tarda ~1-2s)
curl http://localhost:8000/api/v1/compare/mcdonalds-gran-via-madrid

# Segunda petición → Cache HIT (instantánea, <50ms)
curl http://localhost:8000/api/v1/compare/mcdonalds-gran-via-madrid

# Ver las claves cacheadas en Redis
docker exec -it hungrydeal-code-redis-1 redis-cli keys "hd:*"
# → "hd:compare:mcdonalds-gran-via-madrid"

# Ver el TTL restante de una clave
docker exec -it hungrydeal-code-redis-1 redis-cli ttl "hd:compare:mcdonalds-gran-via-madrid"
# → 897 (segundos restantes de los 900 del TTL)
```

---

## 7. ARQUITECTURA RÁPIDA (para explicar)

```
Usuario
  │
  ▼
Next.js 14 (frontend)       ← http://localhost:3000
  │
  ▼ REST API
FastAPI (backend)            ← http://localhost:8000
  ├── /search  → MockAdapter × 3
  └── /compare → Redis caché (15 min)
                    ├── HIT  → respuesta inmediata
                    └── MISS → JustEatAdapter (api.just-eat.es)
                               MockAdapter (uber_eats, glovo)
  │
  ├── PostgreSQL (Supabase)  ← usuarios, historial, restaurantes
  └── Redis                  ← caché de precios
```

**Patrón clave: Adapter Pattern**
```python
class DeliveryAdapter(ABC):
    async def get_price(self, restaurant_id) -> PlatformPrice: ...
    async def safe_get_price(...) -> PlatformPrice:  # nunca explota
        try: return await self.get_price(...)
        except: return PlatformPrice(available=False, error=...)
```

---

## 8. SI ALGO FALLA

**Backend no arranca:**
```bash
cd backend && cat .env  # verificar que DATABASE_URL y SECRET_KEY están
```

**Redis no conecta** → la app funciona igual, solo sin caché. El log dirá:
```
WARNING - Redis no disponible. La app funcionará sin caché.
```

**Just Eat no responde** → la plataforma aparece como "No disponible" en la comparación. El resto de plataformas siguen funcionando.

**Frontend en blanco:**
```bash
cd frontend/web && cat .env.local  # verificar NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

*HungryDeal — TFG 2026 · FastAPI + Next.js + PostgreSQL + Redis*
