export type Platform = 'uber_eats' | 'glovo' | 'just_eat'

export const PLATFORM_NAMES: Record<Platform, string> = {
  uber_eats: 'Uber Eats',
  glovo: 'Glovo',
  just_eat: 'Just Eat',
}

export interface Restaurant {
  id: string
  name: string
  address: string | null
  city: string | null
  platforms: Platform[]
  image_url: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface PlatformPrice {
  platform: Platform
  product_price: number
  delivery_fee: number
  service_fee: number
  total: number
  available: boolean
  redirect_url: string | null
}

export interface ComparisonResult {
  restaurant: Restaurant
  comparison: PlatformPrice[]
  winner: Platform
  savings: number
}

export interface SearchResponse {
  results: Restaurant[]
  total: number
  query: string
}

export interface User {
  id: string
  email: string
  created_at: string
}

export interface SearchHistoryEntry {
  id: string
  query: string | null
  restaurant: Restaurant | null
  platform_chosen: Platform | null
  savings: number | null
  searched_at: string
}
