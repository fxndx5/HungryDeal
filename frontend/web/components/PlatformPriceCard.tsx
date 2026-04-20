import type { PlatformPrice } from '@shared/types'

const PLATFORM_META: Record<string, { name: string; color: string }> = {
  uber_eats: {
    name: 'Uber Eats',
    color: 'bg-black text-white',
  },
  glovo: {
    name: 'Glovo',
    color: 'bg-yellow-400 text-yellow-900',
  },
  just_eat: {
    name: 'Just Eat',
    color: 'bg-orange-500 text-white',
  },
}

interface PlatformPriceCardProps {
  price: PlatformPrice
  isWinner: boolean
  savings?: number
}

export function PlatformPriceCard({ price, isWinner, savings }: PlatformPriceCardProps) {
  const meta = PLATFORM_META[price.platform] ?? {
    name: price.platform,
    color: 'bg-slate-500 text-white',
  }

  if (!price.available) {
    return (
      <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-5 opacity-60">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${meta.color}`}>
            {meta.name}
          </span>
          <span className="text-xs text-slate-400">No disponible ahora</span>
        </div>
        <p className="text-sm text-slate-400 text-center py-2">
          Este restaurante no aparece en {meta.name} o la plataforma no responde.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-card-hover
        ${isWinner
          ? 'border-green-400 bg-green-50 shadow-card'
          : 'border-slate-200 bg-white shadow-card'
        }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.color}`}>
          {meta.name}
        </span>

        {isWinner && (
          <span className="flex items-center gap-1 text-xs font-bold text-green-700
                           bg-green-100 border border-green-200 px-2.5 py-1 rounded-full">
            Mas barato
            {savings != null && savings > 0 && (
              <span className="ml-1 text-green-600">- ahorras {savings.toFixed(2)}EUR</span>
            )}
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <PriceLine label="Producto" value={price.product_price} />
        <PriceLine label="Coste de envio" value={price.delivery_fee} />
        <PriceLine label="Tarifa de servicio" value={price.service_fee} />

        <div className="border-t border-slate-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800">Total real</span>
            <span
              className={`text-2xl font-extrabold ${
                isWinner ? 'text-green-600' : 'text-slate-800'
              }`}
            >
              {price.total.toFixed(2)}EUR
            </span>
          </div>
        </div>
      </div>

      {price.redirect_url && (
        <a
          href={price.redirect_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-4 block w-full text-center py-2.5 rounded-xl font-semibold text-sm
                      transition-colors duration-150
                      ${isWinner
                        ? 'bg-brand-500 hover:bg-brand-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
        >
          {isWinner ? 'Pedir aqui (mejor precio)' : `Pedir en ${meta.name}`}
        </a>
      )}
    </div>
  )
}

function PriceLine({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="flex justify-between items-center text-slate-600">
      <span>{label}</span>
      <span className={value === 0 ? 'text-green-600 font-medium' : ''}>
        {value === 0 ? 'Gratis' : `${value.toFixed(2)}EUR`}
      </span>
    </div>
  )
}
