// shared/api/client.ts
//
// Cliente HTTP base para todas las llamadas al backend de HungryDeal.
// Centraliza la URL base, manejo de errores y headers comunes.
//
// Usamos fetch nativo de Next.js (con caché y revalidación integrada)
// en lugar de axios para no añadir dependencias innecesarias.

// La URL base del backend — se configura por entorno en .env
// En Next.js: NEXT_PUBLIC_API_URL
// En Expo: EXPO_PUBLIC_API_URL
function getBaseUrl(): string {
  // En el browser usamos la variable de entorno del frontend
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  }
  // En el servidor (SSR) también
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
}

export const API_BASE = `${getBaseUrl()}/api/v1`

// Tipos de error personalizados para poder hacer catch específicos en la UI
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Función genérica de fetch con manejo de errores
// options son las mismas que en fetch(), más cache/revalidation de Next.js
export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { revalidate?: number },
): Promise<T> {
  const { revalidate, ...fetchOptions } = options ?? {}

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    // Next.js cache: cuántos segundos hasta revalidar
    // Por defecto no cacheamos (la comparación de precios es tiempo real)
    next: revalidate != null ? { revalidate } : { revalidate: 0 },
  })

  if (!res.ok) {
    // Intentamos parsear el mensaje de error del backend (FastAPI devuelve { detail: "..." })
    let detail: string | undefined
    try {
      const body = await res.json()
      detail = body?.detail
    } catch {
      // Si no podemos parsear, usamos el statusText
    }

    throw new ApiError(
      `Error ${res.status}: ${detail ?? res.statusText}`,
      res.status,
      detail,
    )
  }

  return res.json() as Promise<T>
}
