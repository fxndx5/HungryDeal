-- Extensión necesaria para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ejecutar: psql -U postgres -d nombre_db -f hungrydeal_database.sql

CREATE TABLE IF NOT EXISTS public.users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR      NOT NULL UNIQUE,
    password_hash VARCHAR      NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT now(),
    updated_at    TIMESTAMPTZ  DEFAULT now(),
    first_name    VARCHAR,
    last_name     VARCHAR
);

CREATE TABLE IF NOT EXISTS public.restaurants (
    id          VARCHAR      PRIMARY KEY,
    name        VARCHAR      NOT NULL,
    address     TEXT,
    city        VARCHAR,
    latitude    NUMERIC,
    longitude   NUMERIC,
    platforms   TEXT[],
    image_url   TEXT,
    created_at  TIMESTAMPTZ  DEFAULT now(),
    updated_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_prices (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR     REFERENCES public.restaurants(id),
    platform      VARCHAR     NOT NULL
                              CHECK (platform IN ('uber_eats', 'glovo', 'just_eat')),
    product_price NUMERIC,
    delivery_fee  NUMERIC,
    service_fee   NUMERIC,
    total         NUMERIC,
    available     BOOLEAN     DEFAULT true,
    redirect_url  TEXT,
    fetched_at    TIMESTAMPTZ DEFAULT now(),
    expires_at    TIMESTAMPTZ DEFAULT (now() + INTERVAL '15 minutes')
);

CREATE TABLE IF NOT EXISTS public.search_history (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        REFERENCES public.users(id),
    query            VARCHAR,
    restaurant_id    VARCHAR     REFERENCES public.restaurants(id),
    platform_chosen  VARCHAR     CHECK (
                                     platform_chosen IN ('uber_eats', 'glovo', 'just_eat')
                                     OR platform_chosen IS NULL
                                 ),
    savings          NUMERIC,
    searched_at      TIMESTAMPTZ DEFAULT now()
);

-- Restaurantes de muestra (Madrid)
INSERT INTO public.restaurants (id, name, address, city, latitude, longitude, platforms, created_at, updated_at) VALUES
('mcdonalds-gran-via-madrid',  'McDonald''s Gran Vía',     'Gran Vía, 55',               'Madrid', 40.420000, -3.702500, ARRAY['uber_eats','glovo','just_eat'], '2026-05-24 12:12:08+00', '2026-05-24 12:12:08+00'),
('mcdonalds-sol-madrid',       'McDonald''s Sol',          'Puerta del Sol, 2',          'Madrid', 40.416900, -3.703500, ARRAY['uber_eats','glovo'],            '2026-05-24 12:12:08+00', '2026-05-24 12:12:08+00'),
('kfc-callao-madrid',          'KFC Callao',               'Pl. del Callao, 3',          'Madrid', 40.421500, -3.708000, ARRAY['uber_eats','just_eat'],         '2026-05-24 12:12:08+00', '2026-05-24 12:12:08+00'),
('burger-king-castellana',     'Burger King Castellana',   'Paseo de la Castellana, 14', 'Madrid', 40.425000, -3.692000, ARRAY['glovo','just_eat'],             '2026-05-24 12:12:08+00', '2026-05-24 12:12:08+00'),
('pizza-hut-retiro',           'Pizza Hut Retiro',         'Calle de Alcalá, 70',        'Madrid', 40.419000, -3.689000, ARRAY['uber_eats','glovo','just_eat'], '2026-05-24 12:12:08+00', '2026-05-24 12:12:08+00'),
('dominos-lavapies',           'Domino''s Lavapiés',       'Calle de Embajadores, 25',   'Madrid', 40.409000, -3.703000, ARRAY['uber_eats','just_eat'],         '2026-05-24 12:12:08+00', '2026-05-24 12:12:08+00')
ON CONFLICT (id) DO NOTHING;

-- Usuarios demo — contraseña común: Demo2026! (bcrypt 12 rounds)
INSERT INTO public.users (id, email, password_hash, created_at, updated_at, first_name, last_name) VALUES
('fcfdef64-0896-4d02-aebf-ab881d7c25fe', 'test_demo@hungrydeal.es',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGwbFQOvJNqRLrmCj7Sg3D3MXBK', '2026-04-20 18:41:15+00', '2026-04-20 18:41:14+00', NULL,       NULL),
('ad6795c7-04bf-4719-8055-b0508fd2447e', 'profesor@hungrydeal.es',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGwbFQOvJNqRLrmCj7Sg3D3MXBK', '2026-04-20 19:20:57+00', '2026-04-20 19:20:55+00', NULL,       NULL),
('db8043d5-eb9c-4e12-825d-cf63641d1898', 'profesor@dam.es',          '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGwbFQOvJNqRLrmCj7Sg3D3MXBK', '2026-04-21 08:04:58+00', '2026-04-21 08:04:56+00', 'Profesor', 'DAM'),
('c11167b4-23aa-4c00-b5df-972a39290cc6', 'ejemplo1@gmail.com',       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGwbFQOvJNqRLrmCj7Sg3D3MXBK', '2026-04-20 19:30:54+00', '2026-04-20 19:30:53+00', 'Lara',     'Vera'),
('2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'test@test.com',            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGwbFQOvJNqRLrmCj7Sg3D3MXBK', '2026-05-24 10:49:32+00', '2026-05-24 10:49:31+00', 'Test',     'Test')
ON CONFLICT (id) DO NOTHING;

-- Historial de comparaciones de muestra
INSERT INTO public.search_history (id, user_id, query, restaurant_id, platform_chosen, savings, searched_at) VALUES
('34f9c591-472f-4a19-bacf-8c559f226440', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'Burger King Castellana', 'burger-king-castellana',   'glovo',     0.00, '2026-04-27 12:12:49+00'),
('c37c5d70-93c5-45eb-ab3c-b2cc558288fc', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'KFC Callao',             'kfc-callao-madrid',         'just_eat',  1.49, '2026-04-30 12:12:49+00'),
('a0bcc69b-4350-468f-bb0c-1e34ed7399df', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'Pizza Hut Retiro',       'pizza-hut-retiro',          'uber_eats', 0.98, '2026-05-03 12:12:49+00'),
('5ee918ae-a359-4b4f-8a34-ccf723f87aae', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'McDonald''s Gran Vía',   'mcdonalds-gran-via-madrid', 'glovo',     0.50, '2026-05-06 12:12:49+00'),
('e774f283-13e7-4406-8c9e-b832c0c72a7a', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'Domino''s Lavapiés',     'dominos-lavapies',          'just_eat',  1.49, '2026-05-09 12:12:49+00'),
('b79eb424-34db-49ab-ab84-9787029fdd75', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'Pizza Hut Retiro',       'pizza-hut-retiro',          'just_eat',  2.00, '2026-05-12 12:12:49+00'),
('24b4f174-69f9-4da0-95ea-8a28dafab000', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'Burger King Castellana', 'burger-king-castellana',    'just_eat',  1.00, '2026-05-15 12:12:49+00'),
('71e07197-8c61-448c-80d4-b7c208465a2b', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'KFC Callao',             'kfc-callao-madrid',         'just_eat',  1.49, '2026-05-18 12:12:49+00'),
('7aabf6a4-c707-4490-a1d5-f1566bd127f9', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'McDonald''s Sol',        'mcdonalds-sol-madrid',      'just_eat',  0.48, '2026-05-21 12:12:49+00'),
('cee0d2a5-a3d1-46dd-a309-d9eb2492ee50', '2984f8cd-a4ec-450a-89b5-2b3cbaa0025d', 'McDonald''s Gran Vía',   'mcdonalds-gran-via-madrid', 'just_eat',  1.99, '2026-05-24 12:12:49+00')
ON CONFLICT (id) DO NOTHING;
