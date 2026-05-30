import { apiFetch } from './client'
import type { ComparisonResult } from '../types'

export async function getComparison(restaurantId: string): Promise<ComparisonResult> {
  return apiFetch<ComparisonResult>(`/compare/${restaurantId}`, {
    revalidate: 15 * 60,
  })
}
