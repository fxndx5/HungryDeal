
import type { Metadata } from 'next'
import Link from 'next/link'
import { PlatformPriceCard } from '@/components/PlatformPriceCard'
import { MOCK_COMPARISON, MOCK_RESTAURANTS } from '@/lib/mock-data'
import { getComparison } from '@shared/api/compare'
import type { ComparisonResult } from '@shared/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Comparar precios — ${id.replace(/-/g, ' ')}`,
  }
}

async function fetchComparison(
  id: string
): Promise<{ data: ComparisonResult | null; fromApi: boolean }> {
  try {
    const data = await getComparison(id)
    return { data, fromApi: true }
  } catch {
    if (id === 'mcdonalds-gran-via-madrid') {
      return { data: MOCK_COMPARISON, fromApi: false }
    }
    const restaurant = MOCK_RESTAURANTS.find((r) => r.id === id)
    if (restaurant) {
      return {
        data: {
          ...MOCK_COMPARISON,
          restaurant,
        },
        fromApi: false,
      }
    }

    return { data: null, fromApi: false }
  }
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data, fromApi } = await fetchComparison(id)
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <svg
          className="w-16 h-16 text-slate-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="text-xl font-bold text-slate-700 mb-2">
          Restaurante no encontrado
        </h1>
        <p className="text-slate-400 mb-6">
          No tenemos datos de comparacion para este restaurante todavia.
        </p>
        <Link
          href="/search"
          className="text-brand-500 hover:text-brand-600 font-semibold underline"
        >
          Volver a la busqueda
        </Link>
      </div>
    )
  }
  const sorted = [...data.comparison].sort((a, b) => {
    if (!a.available && b.available) return 1
    if (a.available && !b.available) return -1
    return a.total - b.total
  })

  const cheapest = sorted.find((p) => p.available)
  const mostExpensive = sorted.filter((p) => p.available).at(-1)
  const maxSavings =
    cheapest && mostExpensive && cheapest !== mostExpensive
      ? +(mostExpensive.total - cheapest.total).toFixed(2)
      : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Volver */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1 text-sm text-slate-400
                   hover:text-slate-600 transition-colors mb-6"
      >
        &larr; Volver a resultados
      </Link>

      {/* Cabecera restaurante */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">
          {data.restaurant.name}
        </h1>
        {data.restaurant.address && (
          <p className="text-sm text-slate-400 mt-1">
            {data.restaurant.address}
            {data.restaurant.city && `, ${data.restaurant.city}`}
          </p>
        )}

        {maxSavings > 0.01 && (
          <div className="mt-3 inline-flex items-center gap-2 bg-green-50
                          border border-green-200 rounded-xl px-4 py-2">
            <span className="text-green-600 font-bold text-sm">
              Puedes ahorrar hasta {maxSavings.toFixed(2)} EUR eligiendo bien
            </span>
          </div>
        )}
      </div>

      {/* Tarjetas de precio */}
      <div className="space-y-4">
        {sorted.map((price) => {
          const isWinner = price.available && price.platform === data.winner
          const savings =
            isWinner && mostExpensive && cheapest !== mostExpensive
              ? +(mostExpensive.total - price.total).toFixed(2)
              : undefined

          return (
            <PlatformPriceCard
              key={price.platform}
              price={price}
              isWinner={isWinner}
              savings={savings}
            />
          )
        })}
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center">
        Los precios se actualizan cada 15 minutos. Pueden variar segun tu ubicacion.
      </p>

      {/* Banner de estado */}
      {!fromApi && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          <strong>Modo offline:</strong> Precios de ejemplo.
          Levanta el backend para ver precios en tiempo real.
        </div>
      )}
    </div>
  )
}
