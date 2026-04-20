// shared/api/search.ts
//
// Funciones para llamar al endpoint de búsqueda del backend.
// Endpoint: GET /api/v1/search?q=QUERY&city=CITY

import { apiFetch } from './client'
import type { SearchResponse } from '../types'

interface SearchParams {
  q: string           // texto a buscar
  city?: string       // ciudad (opcional, filtra los resultados)
  limit?: number      // máximo de resultados a devolver (default: 10)
}

export async function searchRestaurants(params: SearchParams): Promise<SearchResponse> {
  // Construimos los query params — solo incluimos los que tienen valor
  const qs = new URLSearchParams()
  qs.set('q', params.q)
  if (params.city) qs.set('city', params.city)
  if (params.limit) qs.set('limit', String(params.limit))

  return apiFetch<SearchResponse>(`/search?${qs.toString()}`, {
    // Cacheamos las búsquedas 60 segundos para no saturar el backend
    // con la misma query repetida
    revalidate: 60,
  })
}
