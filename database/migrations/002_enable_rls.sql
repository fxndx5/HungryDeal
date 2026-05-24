-- ============================================================
-- Migracion 002: Habilitar Row Level Security (RLS)
-- Ejecutar en Supabase SQL Editor
--
-- El backend (FastAPI) conecta como 'postgres' que tiene
-- BYPASSRLS, por lo que estas politicas NO afectan al backend.
-- Solo aplican a conexiones via Supabase JS client (anon/authenticated).
-- ============================================================

-- ---- TABLA: users ----
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede leer y actualizar su propio registro
CREATE POLICY "users: select own row"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: update own row"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Solo el sistema (backend via postgres) puede insertar usuarios
-- (el INSERT lo hace el backend, no el cliente JS directamente)


-- ---- TABLA: restaurants ----
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Lectura publica para todos (incluso anonimos)
CREATE POLICY "restaurants: public read"
  ON public.restaurants
  FOR SELECT
  USING (true);

-- Solo el backend (postgres/service_role) puede escribir


-- ---- TABLA: platform_prices ----
ALTER TABLE public.platform_prices ENABLE ROW LEVEL SECURITY;

-- Lectura publica para todos (incluso anonimos)
CREATE POLICY "platform_prices: public read"
  ON public.platform_prices
  FOR SELECT
  USING (true);

-- Solo el backend (postgres/service_role) puede escribir


-- ---- TABLA: search_history ----
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Cada usuario ve solo su propio historial
CREATE POLICY "search_history: select own"
  ON public.search_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "search_history: insert own"
  ON public.search_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "search_history: delete own"
  ON public.search_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Nota: el backend usa postgres (BYPASSRLS) y puede leer/escribir
-- todo sin restricciones, independientemente de estas politicas.
