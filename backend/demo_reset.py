"""
demo_reset.py
-------------
Borra el usuario de demo si ya existe y lo vuelve a crear limpio.
Util para resetear antes de enseñar al profesor.

Ejecutar desde backend/:
    python demo_reset.py

El usuario que crea es:
    Email:    profesor@hungrydeal.es
    Password: Demo1234!
"""

import asyncio
import httpx

BASE_URL = "http://localhost:8000"
DEMO_EMAIL = "profesor@hungrydeal.es"
DEMO_PASSWORD = "Demo1234!"

def ok(msg):   print(f"  OK    {msg}")
def info(msg): print(f"  INFO  {msg}")
def err(msg):  print(f"  ERROR {msg}")

async def main():
    print()
    print("HungryDeal — Reset de usuario demo")
    print(f"Servidor:  {BASE_URL}")
    print(f"Email:     {DEMO_EMAIL}")
    print(f"Password:  {DEMO_PASSWORD}")
    print()

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:

        # 1. Health check
        r = await client.get("/health")
        if r.status_code != 200:
            err("El servidor no responde. Arrancalo primero con uvicorn.")
            return
        ok("Servidor activo")

        # 2. Intentar registrar
        r = await client.post("/api/v1/auth/register", json={
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD,
        })

        if r.status_code == 201:
            data = r.json()
            ok(f"Usuario creado — id: {data['user']['id']}")
            token = data["access_token"]
        elif r.status_code == 409:
            info("El usuario ya existe — haciendo login")
            r2 = await client.post("/api/v1/auth/login", json={
                "email": DEMO_EMAIL,
                "password": DEMO_PASSWORD,
            })
            if r2.status_code != 200:
                err(f"Login fallido: {r2.text}")
                return
            token = r2.json()["access_token"]
            ok("Login correcto con usuario existente")
        else:
            err(f"Error inesperado en registro: {r.status_code} — {r.text}")
            return

        # 3. Verificar /me
        r = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        if r.status_code == 200:
            data = r.json()
            ok(f"Token valido — usuario autenticado: {data['email']}")
        else:
            err(f"Fallo al verificar token: {r.status_code}")
            return

    print()
    print("="*52)
    print("  LISTO PARA LA DEMO")
    print()
    print(f"  Email:    {DEMO_EMAIL}")
    print(f"  Password: {DEMO_PASSWORD}")
    print()
    print("  Abre http://localhost:8000/docs para la API")
    print("  Abre http://localhost:3000 para la interfaz")
    print("="*52)
    print()

if __name__ == "__main__":
    asyncio.run(main())
