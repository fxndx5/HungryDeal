
import type { Metadata } from 'next'
import { SearchBar } from '@/components/SearchBar'
import { RestaurantCard } from '@/components/RestaurantCard'
import { MOCK_RESTAURANTS } from '@/lib/mock-data'
import { searchRestaurants } from '@shared/api/search'
import type { Restaurant } from '@shared/types'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Resultados para "${q}"` : 'Buscar restaurante',
  }
}

async function fetchResults(query: string): Promise<{ results: Restaurant[]; fromApi: boolean }> {
  try {
    const response = await searchRestaurants({ q: query })
    return { results: response.results, fromApi: true }
  } catch {
    const filtered = MOCK_RESTAURANTS.filter((r) =>
      r.name.toLowerCase().includes(query.toLowerCase())
    )
    return { results: filtered, fromApi: false }
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

  const { results, fromApi } = query
    ? await fetchResults(query)
    : { results: [], fromApi: false }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Buscador */}
      <div className="mb-6">
        <SearchBar initialValue={query} size="md" />
      </div>

      {/* Título con contador */}
      {query && (
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-800">
            {results.length > 0
              ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
              : `Sin resultados para "${query}"`}
          </h1>
          {results.length > 0 && (
            <p className="text-sm text-slate-400 mt-1">
              Haz clic en un restaurante para ver la comparacion de precios
            </p>
          )}
        </div>
      )}

      {/* Lista de resultados */}
      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-16">
          <svg
            className="w-12 h-12 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-slate-700 mb-2">
            No encontramos &quot;{query}&quot;
          </h2>
          <p className="text-slate-400 text-sm">
            Prueba con otro nombre o comprueba la ortografia.
          </p>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400">
          <svg
            className="w-12 h-12 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p>Escribe el nombre de un restaurante para empezar</p>
        </div>
      )}

      {/* Banner de estado — solo visible en desarrollo */}
      {!fromApi && query && process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <strong>Modo desarrollo:</strong> Mostrando datos de ejemplo. Arranca el backend para ver datos reales.
        </div>
      )}
    </div>
  )
}
