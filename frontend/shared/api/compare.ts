// Endpoint: GET /api/v1/compare/{restaurant_id}
// Los precios se cachean 15 min tanto en el backend (Redis) como en el cliente

import { apiFetch } from './client'
import type { ComparisonResult } from '../types'

export async function getComparison(restaurantId: string): Promise<ComparisonResult> {
  return apiFetch<ComparisonResult>(`/compare/${restaurantId}`, {
    revalidate: 15 * 60,
  })
}
