// shared/api/compare.ts
//
// Función para obtener la comparación de precios de un restaurante.
// Endpoint: GET /api/v1/compare/{restaurant_id}
//
// El backend consulta las 3 plataformas (o usa caché de 15 min),
// normaliza los precios y devuelve la comparación ordenada.

import { apiFetch } from './client'
import type { ComparisonResult } from '../types'

export async function getComparison(restaurantId: string): Promise<ComparisonResult> {
  return apiFetch<ComparisonResult>(`/compare/${restaurantId}`, {
    // Los precios tienen TTL de 15 minutos en el backend.
    // Aquí en el cliente también los cacheamos 15 min para no hacer
    // peticiones duplicadas si el usuario recarga la página.
    revalidate: 15 * 60,
  })
}
