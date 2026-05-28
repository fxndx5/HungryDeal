// Tests de integración para la API de HungryDeal.
// Apunta a producción (Render). El servidor puede tardar hasta 60 s en despertar si lleva inactivo.
// Ejecutar con: npx jest

// Timeout global de 90 s por test (Render cold-start puede tardar 60 s)
jest.setTimeout(90_000)

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://hungrydeal.onrender.com'

const TEST_EMAIL = `test_frontend_${Date.now()}@hungrydeal.es`
const TEST_PASSWORD = 'Demo1234!'

let savedToken = ''

describe('HungryDeal API', () => {

  test('GET /health — servidor activo', async () => {
    const res = await fetch(`${BASE_URL}/health`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('ok')
    expect(data.version).toBeDefined()
  })

  test('POST /auth/register — crea usuario con nombre y apellido', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        first_name: 'Test',
        last_name: 'Frontend',
      }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.access_token).toBeDefined()
    expect(data.user.email).toBe(TEST_EMAIL)
    expect(data.user.first_name).toBe('Test')
    expect(data.user.last_name).toBe('Frontend')
    savedToken = data.access_token
  })

  test('POST /auth/login — devuelve token válido', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.access_token).toBeDefined()
    savedToken = data.access_token
  })

  test('GET /auth/me — token válido devuelve usuario', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.email).toBe(TEST_EMAIL)
  })

  test('GET /auth/me — sin token devuelve 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`)
    expect(res.status).toBe(401)
  })

  test('POST /auth/login — contraseña incorrecta devuelve 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: 'incorrecta999' }),
    })
    expect(res.status).toBe(401)
  })

  test('GET /search?q=McDonald — devuelve resultados', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/search?q=McDonald`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.total).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(data.results)).toBe(true)
  })

  test('GET /compare/mcdonalds-gran-via-madrid — devuelve ganador', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/compare/mcdonalds-gran-via-madrid`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.winner).toBeDefined()
    expect(data.savings).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(data.comparison)).toBe(true)
  })

})
