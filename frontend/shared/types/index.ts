// shared/types/index.ts
//
// Tipos TypeScript compartidos entre el frontend web (Next.js) y el móvil (Expo).
// Estos tipos reflejan exactamente la estructura que devuelve el backend FastAPI.
// Si cambias el schema de la API, acuérdate de actualizar esto también.

// Las tres plataformas de delivery que comparamos
export type Platform = 'uber_eats' | 'glovo' | 'just_eat'

// Nombres legibles para mostrar en la UI
export const PLATFORM_NAMES: Record<Platform, string> = {
  uber_eats: 'Uber Eats',
  glovo: 'Glovo',
  just_eat: 'Just Eat',
}

// Un restaurante — datos básicos para la lista de resultados
export interface Restaurant {
  id: string          // slug único: "mcd-gran-via-madrid"
  name: string
  address: string | null
  city: string | null
  platforms: Platform[]   // en qué plataformas está disponible
  image_url: string | null
  latitude?: number | null
  longitude?: number | null
}

// El precio real de UN restaurante en UNA plataforma
// Incluye TODOS los costes, no solo el precio del producto
export interface PlatformPrice {
  platform: Platform
  product_price: number   // lo que cuesta el producto en esa plataforma
  delivery_fee: number    // coste de envío
  service_fee: number     // tarifa de servicio (la que suelen esconder)
  total: number           // = product_price + delivery_fee + service_fee
  available: boolean      // ¿está el restaurante disponible ahora mismo?
  redirect_url: string | null   // enlace para pedir directamente
}

// La respuesta completa de la API cuando comparamos un restaurante
// Es lo que devuelve GET /api/v1/compare/{restaurant_id}
export interface ComparisonResult {
  restaurant: Restaurant
  comparison: PlatformPrice[]   // una entrada por plataforma
  winner: Platform              // la plataforma más barata
  savings: number               // cuánto se ahorra vs la más cara
}

// Respuesta de búsqueda — GET /api/v1/search?q=...
export interface SearchResponse {
  results: Restaurant[]
  total: number
  query: string
}

// Para cuando añadamos usuarios (Fase 4)
export interface User {
  id: string
  email: string
  created_at: string
}

// Una entrada del historial de búsquedas de un usuario
export interface SearchHistoryEntry {
  id: string
  query: string | null
  restaurant: Restaurant | null
  platform_chosen: Platform | null
  savings: number | null
  searched_at: string
}
