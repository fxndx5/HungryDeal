"""
Script para verificar que la conexion a Supabase y el sistema de auth
funcionan correctamente. Ejecutar desde la carpeta backend/:

    cd backend
    python test_auth.py

Prueba las siguientes operaciones en orden:
  1 Conexion a la BD
  2registro de un usuario de prueba
  3Login con ese usuario
  4verificacion del token JWT
  5consulta de /auth/me
  6 ntento de login con contrasena incorrecta (deb fallar con 401)
"""

import asyncio
import sys
import os
import httpx

# --------------------------------------------------------------------------
# Configuracion del test
# --------------------------------------------------------------------------

BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")
TEST_EMAIL = "test_demo@hungrydeal.es"
TEST_PASSWORD = "Demo1234!"

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def ok(msg: str):
    print(f"  PASS  {msg}")

def fail(msg: str):
    print(f"  FAIL  {msg}")
    sys.exit(1)

def section(title: str):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print('='*50)

# --------------------------------------------------------------------------
# Tests
# --------------------------------------------------------------------------

async def test_health(client: httpx.AsyncClient):
    section("1. Health check")
    r = await client.get("/health")
    assert r.status_code == 200, f"Status {r.status_code}"
    data = r.json()
    assert data["status"] == "ok"
    ok(f"Servidor activo — version {data['version']} — env {data['env']}")


async def test_register(client: httpx.AsyncClient) -> str:
    section("2. Registro de usuario")
    r = await client.post("/api/v1/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })

    if r.status_code == 409:
        # Ya existe — hacemos login directamente
        print(f"  INFO  El usuario '{TEST_EMAIL}' ya existe en la BD — saltando al login")
        return ""

    assert r.status_code == 201, f"Esperaba 201, recibio {r.status_code}: {r.text}"
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == TEST_EMAIL
    ok(f"Usuario registrado — id: {data['user']['id']}")
    ok(f"Token recibido: {data['access_token'][:30]}...")
    return data["access_token"]


async def test_login(client: httpx.AsyncClient) -> str:
    section("3. Login")
    r = await client.post("/api/v1/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    assert r.status_code == 200, f"Esperaba 200, recibio {r.status_code}: {r.text}"
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == TEST_EMAIL
    ok(f"Login correcto — email: {data['user']['email']}")
    ok(f"Token: {data['access_token'][:30]}...")
    return data["access_token"]


async def test_me(client: httpx.AsyncClient, token: str):
    section("4. GET /auth/me (token valido)")
    r = await client.get("/api/v1/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert r.status_code == 200, f"Esperaba 200, recibio {r.status_code}: {r.text}"
    data = r.json()
    assert data["email"] == TEST_EMAIL
    ok(f"Usuario autenticado: {data['email']}")
    ok(f"Creado: {data['created_at']}")


async def test_me_sin_token(client: httpx.AsyncClient):
    section("5. GET /auth/me sin token (debe dar 403)")
    r = await client.get("/api/v1/auth/me")
    assert r.status_code in (401, 403), f"Esperaba 401/403, recibio {r.status_code}"
    ok(f"Rechazo correcto: {r.status_code} — {r.json()}")


async def test_login_password_incorrecta(client: httpx.AsyncClient):
    section("6. Login con contrasena incorrecta (debe dar 401)")
    r = await client.post("/api/v1/auth/login", json={
        "email": TEST_EMAIL,
        "password": "contrasena_INCORRECTA_999",
    })
    assert r.status_code == 401, f"Esperaba 401, recibio {r.status_code}: {r.text}"
    ok(f"Rechazo correcto: {r.status_code} — {r.json()['detail']}")


async def test_token_invalido(client: httpx.AsyncClient):
    section("7. Token invalido o manipulado (debe dar 401)")
    r = await client.get("/api/v1/auth/me", headers={
        "Authorization": "Bearer token.falso.manipulado"
    })
    assert r.status_code == 401, f"Esperaba 401, recibio {r.status_code}"
    ok(f"Rechazo correcto: {r.status_code} — {r.json()['detail']}")


async def test_search(client: httpx.AsyncClient):
    section("8. Busqueda de restaurantes (no requiere auth)")
    r = await client.get("/api/v1/search", params={"q": "McDonald"})
    assert r.status_code == 200, f"Status {r.status_code}: {r.text}"
    data = r.json()
    assert data["total"] >= 1
    ok(f"Busqueda OK — {data['total']} resultados para 'McDonald'")
    for res in data["results"]:
        print(f"       {res['name']} — plataformas: {res['platforms']}")


async def test_compare(client: httpx.AsyncClient):
    section("9. Comparacion de precios (no requiere auth)")
    r = await client.get("/api/v1/compare/mcdonalds-gran-via-madrid")
    assert r.status_code == 200, f"Status {r.status_code}: {r.text}"
    data = r.json()
    assert data["winner"] is not None
    ok(f"Comparacion OK — ganador: {data['winner']} — ahorro: {data['savings']} EUR")
    for p in data["comparison"]:
        estado = "disponible" if p["available"] else "no disponible"
        if p["available"]:
            print(f"       {p['platform']:12} total: {p['total']:.2f} EUR ({estado})")


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

async def main():
    print(f"\nHungryDeal — Test de Auth y API")
    print(f"Base URL: {BASE_URL}")
    print(f"Usuario de prueba: {TEST_EMAIL}")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        await test_health(client)

        token = await test_register(client)
        if not token:
            #el usuario ya existia, hcemos login
            token = await test_login(client)
        else:
            # uuario nuevo, verificamos el logn tambien
            await test_login(client)

        await test_me(client, token)
        await test_me_sin_token(client)
        await test_login_password_incorrecta(client)
        await test_token_invalido(client)
        await test_search(client)
        await test_compare(client)

    print(f"\n{'='*50}")
    print(f"  TODOS LOS TESTS PASARON CORRECTAMENTE")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    asyncio.run(main())
