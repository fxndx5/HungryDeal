import Link from 'next/link'
import type { Restaurant } from '@shared/types'

const PLATFORM_BADGES: Record<string, { label: string; classes: string }> = {
  uber_eats: { label: 'Uber Eats', classes: 'bg-black text-white' },
  glovo:     { label: 'Glovo',     classes: 'bg-yellow-400 text-yellow-900' },
  just_eat:  { label: 'Just Eat',  classes: 'bg-orange-500 text-white' },
}

interface RestaurantCardProps {
  restaurant: Restaurant
  minPrice?: number
  savings?: { amount: number; platform: string }
}

const PLATFORM_NAMES: Record<string, string> = {
  uber_eats: 'Uber Eats',
  glovo: 'Glovo',
  just_eat: 'Just Eat',
}

export function RestaurantCard({ restaurant, minPrice, savings }: RestaurantCardProps) {
  return (
    <Link
      href={`/compare/${restaurant.id}`}
      className="block bg-white rounded-2xl border border-slate-200 shadow-card
                 hover:shadow-card-hover hover:border-brand-300
                 transition-all duration-200 p-5 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-800 text-lg group-hover:text-brand-600
                         transition-colors truncate">
            {restaurant.name}
          </h2>

          {restaurant.address && (
            <p className="text-sm text-slate-400 mt-0.5 truncate">
              {restaurant.address}
              {restaurant.city && `, ${restaurant.city}`}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {(restaurant.platforms ?? []).map((platform) => {
              const badge = PLATFORM_BADGES[platform]
              if (!badge) return null
              return (
                <span
                  key={platform}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.classes}`}
                >
                  {badge.label}
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          {minPrice !== undefined && (
            <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
              desde {minPrice.toFixed(2)} &euro;
            </span>
          )}
          {savings && (
            <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap text-right">
              ahorra {savings.amount.toFixed(2)} &euro; en {PLATFORM_NAMES[savings.platform] ?? savings.platform}
            </span>
          )}
          <span className="text-slate-300 group-hover:text-brand-400 text-xl transition-colors mt-0.5">
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
