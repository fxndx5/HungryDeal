import { apiFetch } from './client'
import type { SearchResponse } from '../types'

interface SearchParams {
  q: string
  city?: string
  limit?: number
}

export async function searchRestaurants(params: SearchParams): Promise<SearchResponse> {
  const qs = new URLSearchParams()
  qs.set('q', params.q)
  if (params.city) qs.set('city', params.city)
  if (params.limit) qs.set('limit', String(params.limit))

  return apiFetch<SearchResponse>(`/search?${qs.toString()}`, {
    revalidate: 60,
  })
}
