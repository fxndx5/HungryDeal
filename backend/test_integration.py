"""
test_integration.py
--------------------
Tests de integración para los endpoints principales de HungryDeal.

Requiere el servidor levantado:
    cd backend
    uvicorn app.main:app --host 0.0.0.0 --port 8000

Ejecutar:
    python test_integration.py

O con pytest (requiere pytest + httpx):
    pip install pytest pytest-asyncio httpx --break-system-packages
    pytest test_integration.py -v

Cubre:
  GET /health
  GET /api/v1/search
  GET /api/v1/compare/{restaurant_id}
  GET /api/v1/compare/{restaurant_id} — 404
"""

import asyncio
import sys
import os

import httpx

BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")

# ─── Helpers ──────────────────────────────────────────────────────────────────

def ok(msg: str):   print(f"  PASS  {msg}")
def fail(msg: str): print(f"  FAIL  {msg}"); sys.exit(1)
def section(t: str): print(f"\n{'='*60}\n  {t}\n{'='*60}")
def info(msg: str):  print(f"  INFO  {msg}")


# ─── /health ──────────────────────────────────────────────────────────────────

async def test_health(client: httpx.AsyncClient):
    section("1. GET /health")
    r = await client.get("/health")

    assert r.status_code == 200, f"Esperaba 200, recibió {r.status_code}: {r.text}"
    data = r.json()

    assert "status" in data,  "Falta campo 'status'"
    assert data["status"] == "ok", f"status debe ser 'ok', recibió '{data['status']}'"
    assert "version" in data, "Falta campo 'version'"

    ok(f"Servidor activo — versión {data['version']} — env {data.get('env', 'N/A')}")


# ─── /search ──────────────────────────────────────────────────────────────────

async def test_search_con_resultados(client: httpx.AsyncClient):
    section("2. GET /api/v1/search?q=McDonald — resultados esperados")
    r = await client.get("/api/v1/search", params={"q": "McDonald"})

    assert r.status_code == 200, f"Esperaba 200, recibió {r.status_code}: {r.text}"
    data = r.json()

    # Estructura de la respuesta
    assert "results" in data, "Falta campo 'results'"
    assert "total"   in data, "Falta campo 'total'"
    assert "query"   in data, "Falta campo 'query'"
    assert isinstance(data["results"], list), "'results' debe ser una lista"
    assert data["total"] >= 1, "Debe haber al menos 1 resultado para 'McDonald'"
    assert data["query"] == "McDonald", "El campo 'query' debe reflejar la búsqueda"

    # Estructura de cada restaurante
    r0 = data["results"][0]
    for campo in ("id", "name", "platforms"):
        assert campo in r0, f"Falta campo '{campo}' en el resultado"
    assert isinstance(r0["platforms"], list), "'platforms' debe ser lista"
    assert len(r0["platforms"]) >= 1, "Debe tener al menos 1 plataforma"

    ok(f"Búsqueda OK — {data['total']} resultados para 'McDonald'")
    for res in data["results"][:3]:
        info(f"  {res['name']} — plataformas: {res['platforms']}")


async def test_search_sin_resultados(client: httpx.AsyncClient):
    section("3. GET /api/v1/search?q=xyzabc999 — sin resultados")
    r = await client.get("/api/v1/search", params={"q": "xyzabc999restauranteimposible"})

    assert r.status_code == 200, f"Esperaba 200, recibió {r.status_code}"
    data = r.json()

    assert data["total"] == 0,   "Debe devolver 0 resultados para query absurda"
    assert data["results"] == [], "Lista de resultados debe estar vacía"

    ok("Sin resultados devuelve total=0 y lista vacía correctamente")


async def test_search_query_vacia(client: httpx.AsyncClient):
    section("4. GET /api/v1/search sin ?q — debe dar 422")
    r = await client.get("/api/v1/search")

    assert r.status_code == 422, (
        f"Esperaba 422 (Unprocessable Entity), recibió {r.status_code}"
    )
    ok("Query vacía rechazada con 422 correctamente")


async def test_search_limit(client: httpx.AsyncClient):
    section("5. GET /api/v1/search?q=a&limit=2 — respeta límite")
    r = await client.get("/api/v1/search", params={"q": "a", "limit": "2"})

    assert r.status_code == 200, f"Status {r.status_code}: {r.text}"
    data = r.json()

    assert len(data["results"]) <= 2, (
        f"Con limit=2 no puede devolver más de 2 resultados, devolvió {len(data['results'])}"
    )
    ok(f"Límite respetado — devolvió {len(data['results'])} resultado(s)")


# ─── /compare ─────────────────────────────────────────────────────────────────

async def test_compare_ok(client: httpx.AsyncClient):
    section("6. GET /api/v1/compare/mcdonalds-gran-via-madrid — comparación completa")
    r = await client.get("/api/v1/compare/mcdonalds-gran-via-madrid")

    assert r.status_code == 200, f"Esperaba 200, recibió {r.status_code}: {r.text}"
    data = r.json()

    # Estructura raíz
    for campo in ("restaurant", "comparison", "winner", "savings"):
        assert campo in data, f"Falta campo raíz '{campo}'"

    # Restaurante
    rest = data["restaurant"]
    assert rest["id"] == "mcdonalds-gran-via-madrid"
    assert rest["name"], "El restaurante debe tener nombre"

    # Comparación
    comparison = data["comparison"]
    assert isinstance(comparison, list), "'comparison' debe ser lista"
    assert len(comparison) >= 1, "Debe haber al menos 1 plataforma en la comparación"

    platforms_encontradas = {p["platform"] for p in comparison}
    info(f"Plataformas en respuesta: {platforms_encontradas}")

    # Estructura de cada entrada de precio
    for p in comparison:
        for campo in ("platform", "product_price", "delivery_fee", "service_fee", "total", "available"):
            assert campo in p, f"Falta campo '{campo}' en plataforma '{p.get('platform')}'"
        if p["available"]:
            assert p["total"] >= 0, "Total no puede ser negativo"
            assert p["total"] == round(
                p["product_price"] + p["delivery_fee"] + p["service_fee"], 2
            ), (
                f"total={p['total']} no coincide con la suma de componentes "
                f"({p['product_price']} + {p['delivery_fee']} + {p['service_fee']})"
            )

    # Ganador y ahorro
    plataformas_disponibles = [p for p in comparison if p["available"]]
    if plataformas_disponibles:
        assert data["winner"] in {p["platform"] for p in plataformas_disponibles}, (
            f"El ganador '{data['winner']}' debe ser una plataforma disponible"
        )
        # El ganador debe ser la plataforma con el total más bajo
        totales = {p["platform"]: p["total"] for p in plataformas_disponibles}
        ganador_esperado = min(totales, key=lambda k: totales[k])
        assert data["winner"] == ganador_esperado, (
            f"El ganador debería ser '{ganador_esperado}' (total={totales[ganador_esperado]:.2f}) "
            f"pero se devolvió '{data['winner']}'"
        )
        assert data["savings"] >= 0, "El ahorro no puede ser negativo"

    ok(f"Comparación OK — ganador: {data['winner']} — ahorro: {data['savings']:.2f} €")
    for p in comparison:
        estado = "disponible" if p["available"] else f"no disponible ({p.get('error', '')})"
        if p["available"]:
            print(f"       {p['platform']:12}  total: {p['total']:.2f} € "
                  f"(prod: {p['product_price']:.2f} + envío: {p['delivery_fee']:.2f} + srv: {p['service_fee']:.2f})")
        else:
            print(f"       {p['platform']:12}  {estado}")


async def test_compare_restaurante_inexistente(client: httpx.AsyncClient):
    section("7. GET /api/v1/compare/restaurante-que-no-existe — debe dar 404")
    r = await client.get("/api/v1/compare/restaurante-que-no-existe-xyz-abc")

    assert r.status_code == 404, (
        f"Esperaba 404, recibió {r.status_code}: {r.text}"
    )
    data = r.json()
    assert "detail" in data, "La respuesta 404 debe incluir 'detail'"
    ok(f"404 correcto — detail: {data['detail']}")


async def test_compare_todos_los_restaurantes_mock(client: httpx.AsyncClient):
    section("8. GET /compare — todos los restaurantes del mock")
    slugs = [
        "mcdonalds-gran-via-madrid",
        "mcdonalds-sol-madrid",
        "kfc-callao-madrid",
        "burger-king-castellana",
        "pizza-hut-retiro",
        "dominos-lavapies",
    ]
    errores = []
    for slug in slugs:
        r = await client.get(f"/api/v1/compare/{slug}")
        if r.status_code != 200:
            errores.append(f"{slug} → {r.status_code}")
        else:
            data = r.json()
            if not data.get("winner"):
                errores.append(f"{slug} → sin ganador")

    if errores:
        fail(f"Errores en comparación: {errores}")
    ok(f"Todos los restaurantes mock responden correctamente ({len(slugs)}/{len(slugs)})")


# ─── Main ─────────────────────────────────────────────────────────────────────

async def main():
    print(f"\n{'='*60}")
    print(f"  HungryDeal — Tests de Integración")
    print(f"  Servidor: {BASE_URL}")
    print(f"{'='*60}")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # Verificar que el servidor está levantado antes de empezar
        try:
            health = await client.get("/health")
            if health.status_code != 200:
                print(f"\n  ERROR: El servidor no responde en {BASE_URL}")
                print(f"         Levanta el servidor antes de ejecutar los tests:")
                print(f"         cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000")
                sys.exit(1)
        except httpx.ConnectError:
            print(f"\n  ERROR: No se puede conectar a {BASE_URL}")
            print(f"         Levanta el servidor con:")
            print(f"         cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000")
            sys.exit(1)

        await test_health(client)

        # Tests de búsqueda
        await test_search_con_resultados(client)
        await test_search_sin_resultados(client)
        await test_search_query_vacia(client)
        await test_search_limit(client)

        # Tests de comparación
        await test_compare_ok(client)
        await test_compare_restaurante_inexistente(client)
        await test_compare_todos_los_restaurantes_mock(client)

    print(f"\n{'='*60}")
    print(f"  TODOS LOS TESTS DE INTEGRACIÓN PASARON ✓")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(__file__))
    asyncio.run(main())
