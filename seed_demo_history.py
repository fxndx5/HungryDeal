"""
Insertar historial de demo para test@test.com en produccion (Supabase).

Uso:
  1. Instala requests si no lo tienes: pip install requests
  2. Ejecuta desde la raiz del proyecto:
       python seed_demo_history.py

El script:
  - Hacer login
  - Llama a /api/v1/compare/{id} para generar entradas reales de historial
  - Imprime el resumen al final
"""

import requests
import time

BASE_URL = "https://hungrydeal.onrender.com"

EMAIL    = "test@test.com"
PASSWORD = "test123"

# Restaurantes del mock que el comparador conoce (IDs exactos de mock.py)
RESTAURANTES = [
    "mcdonalds-gran-via-madrid",
    "mcdonalds-sol-madrid",
    "kfc-callao-madrid",
    "burger-king-castellana",
    "pizza-hut-retiro",
    "dominos-lavapies",
    # repetimos 2 para tener mas entradas en el historial
    "mcdonalds-gran-via-madrid",
    "pizza-hut-retiro",
]


def login_or_register() -> str:
    """Devuelve el token JWT del usuario test."""
    print(f"[1/3] Login como {EMAIL} ...")
    r = requests.post(f"{BASE_URL}/api/v1/auth/login",
                      json={"email": EMAIL, "password": PASSWORD}, timeout=90)

    if r.status_code == 200:
        token = r.json()["access_token"]
        print("     Login OK")
        return token

    if r.status_code in (401, 422):
        print("     Usuario no existe, creando cuenta ...")
        r2 = requests.post(f"{BASE_URL}/api/v1/auth/register",
                           json={"email": EMAIL, "password": PASSWORD,
                                 "first_name": "Test", "last_name": "Demo"},
                           timeout=90)
        if r2.status_code == 201:
            print("     Registro OK")
            return r2.json()["access_token"]
        else:
            print(f"     ERROR registro: {r2.status_code} {r2.text}")
            exit(1)

    print(f"     ERROR login: {r.status_code} {r.text}")
    exit(1)


def seed_history(token: str):
    """Llama al endpoint /compare para generar historial real."""
    headers = {"Authorization": f"Bearer {token}"}
    ok = 0
    skip = 0

    print(f"\n[2/3] Generando {len(RESTAURANTES)} comparaciones ...")
    for slug in RESTAURANTES:
        try:
            r = requests.get(f"{BASE_URL}/api/v1/compare/{slug}",
                             headers=headers, timeout=30)
            if r.status_code == 200:
                data = r.json()
                best = data.get("winner", "?")
                savings = data.get("savings", 0) or 0
                print(f"     OK  {slug[:35]:<35} → {best}  ahorro: {savings:.2f} EUR")
                ok += 1
            else:
                print(f"     SKIP {slug[:35]:<35} → HTTP {r.status_code}: {r.text[:200]}")
                skip += 1
        except Exception as e:
            print(f"     SKIP {slug[:35]:<35} → {e}")
            skip += 1
        time.sleep(0.5)   # no saturar el servidor gratuito

    return ok, skip


def print_summary(token: str):
    """Muestra las stats finales del usuario."""
    print("\n[3/3] Stats del perfil ...")
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/api/v1/users/me/history?limit=5",
                     headers=headers, timeout=30)
    if r.status_code == 200:
        data = r.json()
        s = data["stats"]
        print(f"\n  Comparaciones : {s['total_comparisons']}")
        print(f"  Ahorro total  : {s['total_savings']:.2f} EUR")
        print(f"  Restaurantes  : {s['unique_restaurants']}")
        print(f"\n  Ultimas 5 entradas:")
        for item in data["items"]:
            name = item.get("restaurant_name") or item.get("query") or item.get("restaurant_id", "?")
            plat = item.get("platform_chosen") or "-"
            sav  = item.get("savings") or 0
            print(f"    - {name:<35} {plat:<12} -{sav:.2f} EUR")
    else:
        print(f"  No se pudo obtener historial: {r.status_code}")


if __name__ == "__main__":
    print("=" * 60)
    print("  HungryDeal - Seed de datos demo")
    print(f"  Backend: {BASE_URL}")
    print("=" * 60)
    print("\nDespertando el servidor Render (puede tardar 30-50s) ...")

    # Despertar el servidor
    for attempt in range(3):
        try:
            r = requests.get(f"{BASE_URL}/health", timeout=60)
            if r.status_code == 200:
                print(f"Servidor activo: {r.json()}\n")
                break
        except Exception:
            print(f"  Intento {attempt+1}/3 - esperando ...")
            time.sleep(10)
    else:
        print("El servidor no responde. Comprueba que el servicio Render esta activo.")
        exit(1)

    token = login_or_register()
    ok, skip = seed_history(token)
    print_summary(token)

    print(f"\nHecho. {ok} entradas creadas, {ok + skip} intentados.")
    print(f"Abre https://hungrydeal.netlify.app y haz login con {EMAIL} / {PASSWORD}")
