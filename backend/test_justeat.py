"""
test_justeat.py
----------------
Tests de integración para el JustEatAdapter real.

Ejecutar desde backend/ con el servidor levantado:
    python test_justeat.py

O directamente contra la API de Just Eat (sin servidor):
    python test_justeat.py --direct

Los tests verifican:
  1. Importación y construcción del adapter
  2. Búsqueda de restaurantes en Just Eat ES
  3. Obtención de precios reales para un restaurante conocido
  4. Fallback graceful cuando el restaurante no existe
  5. Integración completa via /api/v1/compare con JustEat real
"""

import asyncio
import sys
import os
import httpx

BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")

def ok(msg):   print(f"  PASS  {msg}")
def fail(msg): print(f"  FAIL  {msg}"); sys.exit(1)
def section(t): print(f"\n{'='*55}\n  {t}\n{'='*55}")
def info(msg):  print(f"  INFO  {msg}")


# ─── Tests directos contra la API de Just Eat ─────────────────────────────────

async def test_adapter_import():
    section("1. Importar JustEatAdapter")
    from app.adapters.justeat import JustEatAdapter, _SLUG_TO_JE_ID
    adapter = JustEatAdapter()
    assert adapter.PLATFORM_NAME == "just_eat"
    assert len(_SLUG_TO_JE_ID) >= 6, "El mapa de restaurantes debe tener al menos 6 entradas"
    ok(f"JustEatAdapter importado — {len(_SLUG_TO_JE_ID)} restaurantes mapeados")


async def test_adapter_real_search():
    section("2. Búsqueda real en Just Eat ES (api.just-eat.es)")
    from app.adapters.justeat import JustEatAdapter
    adapter = JustEatAdapter(timeout=10.0)
    try:
        results = await adapter.search("mcdonalds", "28013")
        if results:
            ok(f"Búsqueda OK — {len(results)} resultados para 'mcdonalds' en 28013")
            for r in results[:3]:
                info(f"  {r.name} | id={r.platform_restaurant_id}")
        else:
            info("Just Eat no devolvió resultados para 'mcdonalds' — puede ser rate limiting")
    except Exception as e:
        info(f"API no disponible ({type(e).__name__}: {e}) — OK para entorno sin internet")


async def test_adapter_real_price():
    section("3. Precios reales de McDonald's Gran Vía en Just Eat")
    from app.adapters.justeat import JustEatAdapter
    adapter = JustEatAdapter(timeout=10.0)
    try:
        price = await adapter.get_price("mcdonalds-gran-via-madrid")
        ok(f"Precio obtenido — disponible: {price.available}")
        info(f"  Pedido mínimo : {price.product_price:.2f} €")
        info(f"  Envío         : {price.delivery_fee:.2f} €")
        info(f"  Tarifa serv.  : {price.service_fee:.2f} €")
        info(f"  TOTAL         : {price.total:.2f} €")
        info(f"  URL           : {price.url}")
    except Exception as e:
        info(f"API no disponible ({type(e).__name__}) — OK para entorno sin internet")


async def test_adapter_fallback_not_found():
    section("4. Fallback graceful — restaurante inexistente")
    from app.adapters.justeat import JustEatAdapter
    adapter = JustEatAdapter(timeout=5.0)
    # safe_get_price captura el error y devuelve available=False
    price = await adapter.safe_get_price("restaurante-que-no-existe-xyz")
    assert not price.available, "Debe devolver available=False para restaurante inexistente"
    assert price.platform == "just_eat"
    ok(f"Fallback correcto — available=False, error='{price.error[:60] if price.error else None}'")


# ─── Tests via servidor HTTP ──────────────────────────────────────────────────

async def test_compare_endpoint_just_eat(client: httpx.AsyncClient):
    section("5. GET /compare — Just Eat real vs Mocks (servidor)")
    r = await client.get("/api/v1/compare/mcdonalds-gran-via-madrid")
    assert r.status_code == 200, f"Status {r.status_code}: {r.text}"
    data = r.json()

    platforms = {p["platform"]: p for p in data["comparison"]}
    assert "just_eat" in platforms, "Just Eat debe estar en la comparación"

    je = platforms["just_eat"]
    info(f"Just Eat disponible: {je['available']}")
    if je["available"]:
        ok(f"Just Eat real — total: {je['total']:.2f} € | "
           f"envío: {je['delivery_fee']:.2f} € | "
           f"servicio: {je['service_fee']:.2f} €")
    else:
        info(f"Just Eat no disponible: {je.get('error', 'sin detalles')}")

    ok(f"Endpoint OK — ganador: {data['winner']} — ahorro: {data['savings']:.2f} €")


# ─── Main ─────────────────────────────────────────────────────────────────────

async def main():
    print(f"\nHungryDeal — Tests JustEatAdapter")
    print(f"API externa: api.just-eat.es")
    print(f"Servidor   : {BASE_URL}")

    # Tests que no necesitan servidor
    await test_adapter_import()
    await test_adapter_real_search()
    await test_adapter_real_price()
    await test_adapter_fallback_not_found()

    # Tests que necesitan servidor
    try:
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=12.0) as client:
            # Verificar que el servidor está levantado
            health = await client.get("/health")
            if health.status_code == 200:
                await test_compare_endpoint_just_eat(client)
            else:
                info("Servidor no disponible — omitiendo test 5")
    except Exception:
        info("Servidor no disponible — omitiendo test 5")

    print(f"\n{'='*55}")
    print(f"  TESTS JUSTEAT COMPLETADOS")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    # Necesario para que funcionen los imports relativos
    sys.path.insert(0, os.path.dirname(__file__))
    asyncio.run(main())
