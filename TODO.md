# TODO — HungryDeal

> Basado en el Roadmap y la documentación del vault de Obsidian.
> Marcar con [x] cuando se complete cada tarea.

---

## Fase 0 — Setup Inicial

- [x] Definir stack tecnológico (ADR-001)
- [x] Crear vault en Obsidian (cerebro del proyecto)
- [x] Crear estructura de carpetas del proyecto
- [x] Configurar variables de entorno (.env.example)
- [x] Configurar .gitignore
- [x] Crear Dockerfile del backend
- [x] Crear docker-compose.yml (PostgreSQL + Redis + Backend)
- [x] Crear main.py base de FastAPI con CORS y /health
- [x] Inicializar proyecto Next.js 14 en `frontend/web/`
- [ ] Inicializar proyecto Expo en `frontend/mobile/`
- [ ] Verificar que `docker compose up` levanta todo correctamente
- [ ] Primer commit al repositorio

---

## Fase 1 — Backend Core (Semanas 2–4)

### 1.1 Configuración y base de datos
- [x] Crear `app/core/config.py` con pydantic-settings (Settings)
- [x] Crear `app/core/database.py` con sesión async de SQLAlchemy
- [x] Configurar Alembic (`alembic init alembic`)
- [x] Modelo SQLAlchemy: `User` (id UUID, email, password_hash, timestamps)
- [x] Modelo SQLAlchemy: `Restaurant` (id slug, name, address, city, lat/lng, platforms[], image_url)
- [x] Modelo SQLAlchemy: `PlatformPrice` (restaurant_id FK, platform, product_price, delivery_fee, service_fee, total, available, redirect_url, fetched_at, expires_at)
- [x] Modelo SQLAlchemy: `SearchHistory` (user_id FK, query, restaurant_id FK, platform_chosen, savings)
- [x] Crear migración inicial con Alembic y aplicar (via Supabase MCP)
- [x] Crear índice `idx_platform_prices_restaurant_platform` (restaurant_id, platform, expires_at)

### 1.2 Adapter pattern (scraping)
- [x] Crear `app/adapters/base.py` con clase abstracta `DeliveryAdapter` y dataclass `PlatformPrice`
- [x] Crear `app/adapters/mock.py` con datos mock para desarrollo (6 restaurantes, 3 plataformas)
- [ ] Crear `app/adapters/justeat.py` (scraping con httpx, API interna de Just Eat)
- [ ] Tests unitarios para el adapter de Just Eat
- [x] Crear `app/services/price_comparator.py` (orquesta los adapters, devuelve comparación)
- [x] Crear `app/services/price_normalizer.py` (normaliza diferencias entre plataformas)

### 1.3 Endpoints API v1
- [x] Crear `app/api/routes/search.py` — `GET /api/v1/search?q=...&city=...`
- [x] Crear `app/api/routes/compare.py` — `GET /api/v1/compare/{restaurant_id}`
- [x] Registrar routers en `main.py` con prefijo `/api/v1`
- [x] Crear schemas Pydantic: `SearchResponse`, `ComparisonResponse`, `PlatformPriceSchema`
- [x] Frontend conectado a la API real con fallback a mock automático
- [ ] Tests de integración para endpoints search y compare

---

## Fase 2 — Frontend MVP (Semanas 5–7)

### 2.1 Frontend Web (Next.js)
- [x] Crear layout raíz (`app/layout.tsx`) con metadatos y fuentes
- [x] Crear página home (`app/page.tsx`) con SearchBar
- [x] Crear componente `SearchBar.tsx` (formulario con redirect a /search)
- [x] Crear página de resultados (`app/search/page.tsx`)
- [x] Crear componente `RestaurantCard.tsx`
- [x] Crear página de comparación (`app/compare/[id]/page.tsx`)
- [x] Crear componente `PlatformPriceCard.tsx` (desglose de precios, badge "Más barato")
- [x] Botón "Pedir aquí" con redirect a la plataforma ganadora
- [x] Diseño responsive (mobile-first con Tailwind)

### 2.2 Código compartido (`frontend/shared/`)
- [x] Crear `shared/types/index.ts` (Restaurant, Platform, PlatformPrice, ComparisonResult)
- [x] Crear `shared/api/client.ts` (fetch wrapper con base URL del backend)
- [x] Crear `shared/api/search.ts` (función searchRestaurants)
- [x] Crear `shared/api/compare.ts` (función getComparison)

---

## Fase 3 — Adapters Adicionales (Semana 8)

- [ ] Crear `app/adapters/glovo.py` (scraping con Playwright, delays aleatorios anti-bot)
- [ ] Crear `app/adapters/ubereats.py` (scraping o datos mock iniciales)
- [ ] Normalización de precios entre plataformas (Glovo infla producto, Uber Eats Small Order Fee, Just Eat envío variable)
- [ ] Manejo de errores: si un adapter falla, devolver `available: false` sin romper la respuesta
- [ ] Caché de precios en PostgreSQL con TTL de 15 minutos
- [ ] Tarea de limpieza de precios expirados (`DELETE WHERE expires_at < NOW() - INTERVAL '1 day'`)
- [ ] Tests unitarios para cada adapter

---

## Fase 4 — Sistema de Usuarios (Semanas 9–10)

### 4.1 Autenticación JWT
- [ ] Crear `app/core/security.py` (create_access_token, verify_password, get_password_hash, decode_token)
- [ ] Crear `app/api/deps.py` (dependency get_current_user con OAuth2PasswordBearer)
- [ ] Crear `app/api/routes/auth.py` — `POST /api/v1/auth/register` y `POST /api/v1/auth/login`
- [ ] Crear schemas Pydantic: `UserCreate`, `UserLogin`, `TokenResponse`
- [ ] Hashing con bcrypt (coste 12)
- [ ] Tokens con expiración de 30 días

### 4.2 Perfil y historial
- [ ] Crear `app/api/routes/users.py` — `GET /api/v1/users/me` y `GET /api/v1/users/me/history`
- [ ] Guardar búsquedas en search_history cuando el usuario hace una comparación
- [ ] Frontend: pantalla de historial de búsquedas
- [ ] Frontend: mostrar ahorro total del usuario (último mes)

---

## Fase 5 — Pulido y Deploy (Semanas 11–12)

### 5.1 Testing
- [ ] Tests unitarios completos para services
- [ ] Tests de integración para todos los endpoints
- [ ] Tests E2E básicos del frontend

### 5.2 Optimización
- [ ] Redis como caché opcional (acelerar consultas de precios frecuentes)
- [ ] Optimización de queries SQL (revisar EXPLAIN de queries de comparación)
- [ ] Rate limiting por IP en FastAPI

### 5.3 Documentación y deploy
- [ ] Verificar documentación Swagger autogenerada está completa
- [ ] Docker Compose de producción (sin --reload, sin volúmenes de desarrollo)
- [ ] Nginx como reverse proxy (opcional)
- [ ] Deploy a servidor/cloud

---

## Extras / Futuro

- [ ] Geolocalización para mostrar restaurantes cercanos
- [ ] Alertas de precio (notificar si baja el coste en alguna plataforma)
- [ ] Versión Premium con estadísticas de ahorro
- [ ] API pública para terceros
- [ ] Comisión por redirect afiliado a las plataformas
- [ ] Frontend móvil completo con React Native + Expo

---

## Notas

- **Obsidian vault:** `C:\Users\Fernanda\Desktop\HungryDeal\HungryDeal\` — documentación detallada de cada sección
- **Patrón principal:** Adapter pattern para abstraer plataformas de delivery
- **Prioridad del MVP:** Just Eat primero (API más accesible), luego Glovo, luego Uber Eats
- **Caché:** Precios se cachean 15 min en PostgreSQL para no saturar scrapers
- **Seguridad:** SECRET_KEY mínimo 32 chars, HTTPS en producción, no guardar tokens en localStorage
