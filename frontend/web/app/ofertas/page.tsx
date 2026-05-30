import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { MOCK_RESTAURANTS, MOCK_SUMMARIES, MOCK_CATEGORIES } from '@/lib/mock-data'
import { CategoryFilter } from '@/components/CategoryFilter'

export const metadata: Metadata = {
  title: 'Ofertas - HungryDeal',
  description: 'Los restaurantes con mayor ahorro entre plataformas de delivery',
}

const PLATFORM_NAMES: Record<string, string> = {
  uber_eats: 'Uber Eats',
  glovo: 'Glovo',
  just_eat: 'Just Eat',
}

const PLATFORM_CLASSES: Record<string, string> = {
  uber_eats: 'bg-black text-white',
  glovo: 'bg-yellow-400 text-yellow-900',
  just_eat: 'bg-orange-500 text-white',
}

export default async function OfertasPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const activeCategory = cat?.trim() || undefined

  const allRanked = MOCK_SUMMARIES
    .slice()
    .sort((a, b) => b.max_savings - a.max_savings)
    .map((summary) => ({
      summary,
      restaurant: MOCK_RESTAURANTS.find((r) => r.id === summary.restaurant_id),
      category: MOCK_CATEGORIES[summary.restaurant_id],
    }))
    .filter((item) => item.restaurant !== undefined)

  const ranked = activeCategory
    ? allRanked.filter((item) => item.category === activeCategory)
    : allRanked

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800">Ofertas del dia</h1>
        <p className="text-sm text-slate-400 mt-1">
          Restaurantes ordenados por el mayor ahorro posible entre plataformas
        </p>
      </div>

      <Suspense>
        <CategoryFilter active={activeCategory} />
      </Suspense>

      {ranked.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-slate-500 font-semibold">Sin restaurantes en esta categoria</p>
          <p className="text-slate-400 text-sm mt-1">Prueba con otra categoria o ve todas las ofertas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map(({ summary, restaurant }, index) => {
            if (!restaurant) return null
            return (
              <Link
                key={restaurant.id}
                href={`/compare/${restaurant.id}`}
                className="block bg-white rounded-2xl border border-slate-200 shadow-card
                           hover:shadow-card-hover hover:border-brand-300
                           transition-all duration-200 p-5 group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                font-bold text-sm
                                ${index === 0
                                  ? 'bg-amber-400 text-amber-900'
                                  : index === 1
                                  ? 'bg-slate-300 text-slate-700'
                                  : index === 2
                                  ? 'bg-orange-300 text-orange-900'
                                  : 'bg-slate-100 text-slate-500'
                                }`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-bold text-slate-800 text-lg group-hover:text-brand-600
                                       transition-colors truncate">
                          {restaurant.name}
                        </h2>
                        {restaurant.address && (
                          <p className="text-sm text-slate-400 mt-0.5 truncate">
                            {restaurant.address}{restaurant.city && `, ${restaurant.city}`}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="text-xl font-extrabold text-green-600">
                          -{summary.max_savings.toFixed(2)} &euro;
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">de ahorro</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="text-xs text-slate-500">Mejor precio en:</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                    ${PLATFORM_CLASSES[summary.winner_platform] ?? 'bg-slate-100 text-slate-700'}`}
                      >
                        {PLATFORM_NAMES[summary.winner_platform]}
                      </span>
                      <span className="text-xs text-slate-600 font-semibold">
                        desde {summary.min_price.toFixed(2)} &euro;
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-brand-50 border border-brand-100 rounded-2xl text-sm text-brand-700">
        <strong>Como funciona:</strong> Comparamos el precio total (producto + envio + tasas) en
        todas las plataformas disponibles para cada restaurante. El ahorro que ves es la diferencia
        entre la plataforma mas cara y la mas barata.
      </div>
    </div>
  )
}
