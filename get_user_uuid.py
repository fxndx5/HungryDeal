"""
get_user_uuid.py
----------------
Obtiene el UUID del usuario test@test.com y genera el SQL
para insertar historial de demo directamente en Supabase.

Uso:
  python get_user_uuid.py

Luego copia el SQL que imprime y pegalo en:
  Supabase → SQL Editor → New query → Run
"""

import requests
import base64
import json
import time

BASE_URL = "https://hungrydeal.onrender.com"
EMAIL    = "test@test.com"
PASSWORD = "test123"


def decode_jwt_payload(token: str) -> dict:
    """Decodifica el payload del JWT sin verificar firma."""
    payload_b64 = token.split(".")[1]
    # Añadir padding si falta
    payload_b64 += "=" * (-len(payload_b64) % 4)
    return json.loads(base64.b64decode(payload_b64))


def get_token() -> str:
    print("Despertando servidor Render ...")
    for _ in range(3):
        try:
            r = requests.get(f"{BASE_URL}/health", timeout=60)
            if r.ok:
                print(f"OK: {r.json()}")
                break
        except Exception:
            time.sleep(5)

    print(f"\nLogin como {EMAIL} ...")
    r = requests.post(f"{BASE_URL}/api/v1/auth/login",
                      json={"email": EMAIL, "password": PASSWORD}, timeout=30)

    if r.status_code == 200:
        token = r.json()["access_token"]
        print("Login OK")
        return token

    # Si no existe, registrar
    print("Registrando usuario ...")
    r2 = requests.post(f"{BASE_URL}/api/v1/auth/register",
                       json={"email": EMAIL, "password": PASSWORD,
                             "first_name": "Test", "last_name": "Demo"},
                       timeout=30)
    if r2.status_code == 201:
        print("Registro OK")
        return r2.json()["access_token"]

    print(f"ERROR: {r.status_code} {r.text}")
    exit(1)


def generate_sql(user_uuid: str) -> str:
    entries = [
        ("McDonald's Gran Via",  "mcdonalds-gran-via-madrid", "just_eat",  1.99),
        ("McDonald's Sol",       "mcdonalds-sol-madrid",      "just_eat",  0.48),
        ("KFC Callao",           "kfc-callao-madrid",         "just_eat",  1.49),
        ("Burger King Castellana","burger-king-castellana",   "just_eat",  1.00),
        ("Pizza Hut Retiro",     "pizza-hut-retiro",          "just_eat",  2.00),
        ("Dominos Lavapies",     "dominos-lavapies",          "just_eat",  1.49),
        ("McDonald's Gran Via",  "mcdonalds-gran-via-madrid", "glovo",     0.50),
        ("Pizza Hut Retiro",     "pizza-hut-retiro",          "uber_eats", 0.98),
        ("KFC Callao",           "kfc-callao-madrid",         "just_eat",  1.49),
        ("Burger King Castellana","burger-king-castellana",   "glovo",     0.00),
    ]

    rows = []
    for i, (name, rest_id, platform, savings) in enumerate(entries):
        # Fechas variadas en los ultimos 30 dias
        interval = f"{i * 3} days"
        rows.append(
            f"  (gen_random_uuid(), '{user_uuid}', "
            f"'{name}', '{rest_id}', '{platform}', {savings}, "
            f"NOW() - INTERVAL '{interval}')"
        )

    sql = f"""-- HungryDeal: historial de demo para test@test.com
-- Pega esto en Supabase > SQL Editor > New query > Run

INSERT INTO search_history
  (id, user_id, query, restaurant_id, platform_chosen, savings, searched_at)
VALUES
{chr(10).join(rows[:-1])}
{rows[-1]};

-- Verificar resultado:
SELECT COUNT(*), SUM(savings) FROM search_history WHERE user_id = '{user_uuid}';
"""
    return sql


if __name__ == "__main__":
    token = get_token()
    payload = decode_jwt_payload(token)
    user_uuid = payload.get("sub")
    print(f"\nUser UUID: {user_uuid}")

    sql = generate_sql(user_uuid)
    print("\n" + "=" * 60)
    print("COPIA Y EJECUTA ESTE SQL EN SUPABASE > SQL EDITOR:")
    print("=" * 60)
    print(sql)
    print("=" * 60)
