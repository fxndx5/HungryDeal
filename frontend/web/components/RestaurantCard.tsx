import Link from 'next/link'
import type { Restaurant } from '@shared/types'

const PLATFORM_BADGES: Record<string, { label: string; classes: string }> = {
  uber_eats: { label: 'Uber Eats', classes: 'bg-black text-white' },
  glovo:     { label: 'Glovo',     classes: 'bg-yellow-400 text-yellow-900' },
  just_eat:  { label: 'Just Eat',  classes: 'bg-orange-500 text-white' },
}

interface RestaurantCardProps {
  restaurant: Restaurant
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link
      href={`/compare/${restaurant.id}`}
      className="block bg-white rounded-2xl border border-slate-200 shadow-card
                 hover:shadow-card-hover hover:border-brand-300
                 transition-all duration-200 p-5 group"
    >
      <div className="flex items-start justify-between gap-3">
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

        <div className="flex-shrink-0 text-slate-300 group-hover:text-brand-400 text-xl
                        transition-colors mt-1">
          &rarr;
        </div>
      </div>
    </Link>
  )
}
