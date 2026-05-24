import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MOCK_RESTAURANTS, MOCK_SUMMARIES } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Cerca de ti - HungryDeal',
  description: 'Restaurantes cercanos con comparacion de precios',
}

const MapView = dynamic(
  () => import('@/components/MapView').then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-sm"
        style={{ height: '480px' }}
      >
        Cargando mapa...
      </div>
    ),
  }
)

const PLATFORM_CLASSES: Record<string, string> = {
  uber_eats: 'bg-black text-white',
  glovo: 'bg-yellow-400 text-yellow-900',
  just_eat: 'bg-orange-500 text-white',
}

const PLATFORM_NAMES: Record<string, string> = {
  uber_eats: 'Uber Eats',
  glovo: 'Glovo',
  just_eat: 'Just Eat',
}

export default function CercaPage() {
  const withCoords = MOCK_RESTAURANTS.filter((r) => r.latitude && r.longitude)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Cerca de ti</h1>
        <p className="text-sm text-slate-400 mt-1">
          Restaurantes en Madrid disponibles en plataformas de delivery. Haz clic en un marcador para comparar precios.
        </p>
      </div>

      {/* isolation:isolate crea un nuevo stacking context que confina los z-index
          internos de Leaflet (hasta 1000) dentro de este div, evitando que
          sobrepasen el z-50 del Navbar sticky */}
      <div
        className="rounded-2xl overflow-hidden border border-slate-200 shadow-card mb-8"
        style={{ isolation: 'isolate' }}
      >
        <MapView restaurants={withCoords} />
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-3">Lista de restaurantes</h2>
      <div className="space-y-3">
        {withCoords.map((restaurant) => {
          const summary = MOCK_SUMMARIES.find((s) => s.restaurant_id === restaurant.id)
          return (
            <Link
              key={restaurant.id}
              href={`/compare/${restaurant.id}`}
              className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200
                         shadow-card hover:shadow-card-hover hover:border-brand-300
                         transition-all duration-200 p-4 group"
            >
              <div className="flex-shrink-0 w-9 h-9 bg-brand-500 rounded-full flex items-center
                              justify-center text-white font-bold text-base">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 group-hover:text-brand-600 transition-colors truncate">
                  {restaurant.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {restaurant.address}{restaurant.city && `, ${restaurant.city}`}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(restaurant.platforms ?? []).map((p) => (
                    <span
                      key={p}
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLATFORM_CLASSES[p] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {PLATFORM_NAMES[p] ?? p}
                    </span>
                  ))}
                </div>
              </div>

              {summary && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-bold text-green-600">
                    desde {summary.min_price.toFixed(2)} &euro;
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    ahorra {summary.max_savings.toFixed(2)} &euro;
                  </div>
                </div>
              )}

              <div className="flex-shrink-0 text-slate-300 group-hover:text-brand-400 text-xl transition-colors">
                &rarr;
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
