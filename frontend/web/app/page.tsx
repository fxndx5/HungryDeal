import Image from 'next/image'
import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'
import { MOCK_RESTAURANTS, MOCK_SUMMARIES, MOCK_CATEGORIES } from '@/lib/mock-data'

const CARD_IMAGES: Record<string, string> = {
  'mcdonalds-gran-via-madrid': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=220&fit=crop&auto=format&q=80',
  'mcdonalds-sol-madrid':      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=220&fit=crop&auto=format&q=80',
  'kfc-callao-madrid':         'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=220&fit=crop&auto=format&q=80',
  'burger-king-castellana':    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=220&fit=crop&auto=format&q=80',
  'telepizza-arguelles':       'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=220&fit=crop&auto=format&q=80',
  'vips-gran-via':             'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=220&fit=crop&auto=format&q=80',
  'istanbul-kebab-lavapies':   'https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=600&h=220&fit=crop&auto=format&q=80',
  'wok-to-walk-callao':        'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&h=220&fit=crop&auto=format&q=80',
}

const PLATFORM_NAMES: Record<string, string> = {
  uber_eats: 'Uber Eats',
  glovo:     'Glovo',
  just_eat:  'Just Eat',
}

const PLATFORM_CLASSES: Record<string, string> = {
  uber_eats: 'bg-black text-white',
  glovo:     'bg-yellow-400 text-yellow-900',
  just_eat:  'bg-orange-500 text-white',
}

const CATEGORIES_DISPLAY = [
  {
    id: 'hamburguesa',
    label: 'Hamburguesas',
    count: 4,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=160&fit=crop&auto=format&q=80',
  },
  {
    id: 'pizza',
    label: 'Pizza',
    count: 2,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=160&fit=crop&auto=format&q=80',
  },
  {
    id: 'turco',
    label: 'Turco',
    count: 1,
    image: 'https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=400&h=160&fit=crop&auto=format&q=80',
  },
  {
    id: 'asiatico',
    label: 'Asiatico',
    count: 1,
    image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=160&fit=crop&auto=format&q=80',
  },
  {
    id: null,
    label: 'Ver todos',
    count: 8,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=160&fit=crop&auto=format&q=80',
  },
]

const TOP_SAVINGS = MOCK_SUMMARIES
  .slice()
  .sort((a, b) => b.max_savings - a.max_savings)
  .slice(0, 3)
  .map((s) => ({
    summary: s,
    restaurant: MOCK_RESTAURANTS.find((r) => r.id === s.restaurant_id)!,
    category: MOCK_CATEGORIES[s.restaurant_id],
  }))
  .filter((x) => x.restaurant)

export default function HomePage() {
  return (
    <div className="bg-slate-50">

      {/* ── HERO ── */}
      <section
        style={{ background: 'linear-gradient(160deg, #1d4949 0%, #2D6F6F 55%, #4d9090 100%)' }}
      >
        <div className="relative">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-14 md:pt-20 md:pb-16">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-5">
                <Image src="/logo3.png" alt="HungryDeal" width={52} height={52} className="drop-shadow-lg" />
                <span className="text-white text-3xl font-extrabold tracking-tight">
                  Hungry<span style={{ color: '#D4A843' }}>Deal</span>
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3 max-w-3xl">
                El mismo pedido, el mejor precio
              </h1>
              <p className="text-lg text-white/75 mb-8 max-w-xl">
                Compara Uber Eats, Glovo y Just Eat con envio y tasas incluidas. Sin sorpresas.
              </p>

              <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-2 mb-5">
                <SearchBar />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {["McDonald's", 'KFC', 'Burger King', 'Telepizza', 'Kebab'].map((name) => (
                  <Link
                    key={name}
                    href={`/search?q=${encodeURIComponent(name)}`}
                    className="text-sm bg-white/10 hover:bg-white/20 text-white/90
                               px-4 py-1.5 rounded-full transition-colors border border-white/20"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-center gap-12 md:gap-20">
            {[
              { value: '8+',  label: 'Restaurantes' },
              { value: '3',   label: 'Plataformas' },
              { value: '3 €', label: 'Ahorro medio' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="text-xs text-white/55 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIAS ── */}
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Explora por tipo de comida</h2>
        <div className="grid grid-cols-5 gap-3">
          {CATEGORIES_DISPLAY.map((cat) => (
            <Link
              key={cat.label}
              href={cat.id ? `/ofertas?cat=${cat.id}` : '/search'}
              className="group rounded-2xl overflow-hidden border border-slate-200
                         shadow-card hover:shadow-card-hover transition-all duration-200
                         hover:-translate-y-0.5"
            >
              <div className="relative h-20 overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors" />
                <p className="absolute inset-0 flex items-center justify-center
                               text-white text-sm font-bold drop-shadow">
                  {cat.label}
                </p>
              </div>
              <div className="bg-white px-2 py-2 text-center">
                <p className="text-xs text-slate-400">{cat.count} restaurantes</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── RESTAURANTES POPULARES ── */}
      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Restaurantes populares</h2>
            <p className="text-sm text-slate-400 mt-0.5">Los mas pedidos en Madrid</p>
          </div>
          <Link href="/search" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            Ver todos &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_RESTAURANTS.map((restaurant) => {
            const summary = MOCK_SUMMARIES.find((s) => s.restaurant_id === restaurant.id)
            const imgSrc = CARD_IMAGES[restaurant.id]

            return (
              <Link
                key={restaurant.id}
                href={`/compare/${restaurant.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200
                           shadow-card hover:shadow-card-hover transition-all duration-200
                           hover:-translate-y-0.5"
              >
                <div className="relative h-36 overflow-hidden">
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {summary && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white
                                     text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                      -{summary.max_savings.toFixed(2)} &euro; ahorro
                    </span>
                  )}

                  <span className="absolute bottom-3 right-3 text-white/80 text-xs font-medium">
                    {(restaurant.platforms ?? []).length} plataformas
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-slate-800 group-hover:text-brand-600
                                 transition-colors truncate text-base">
                    {restaurant.name}
                  </h3>
                  {restaurant.address && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {restaurant.address}{restaurant.city && `, ${restaurant.city}`}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-3">
                    {(restaurant.platforms ?? []).map((p) => (
                      <span key={p} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLATFORM_CLASSES[p] ?? ''}`}>
                        {PLATFORM_NAMES[p]}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    {summary ? (
                      <span className="text-sm font-bold text-slate-700">
                        desde <span className="text-brand-600">{summary.min_price.toFixed(2)} &euro;</span>
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">Ver precios</span>
                    )}
                    <span className="text-xs font-semibold text-brand-500 group-hover:text-brand-700 transition-colors">
                      Comparar &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── MEJORES AHORROS ── */}
      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Donde mas ahorras hoy</h2>
            <p className="text-sm text-slate-400 mt-0.5">Top ahorros disponibles ahora mismo</p>
          </div>
          <Link href="/ofertas" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">
            Ver todas las ofertas &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOP_SAVINGS.map(({ summary, restaurant }, i) => {
            const imgSrc = CARD_IMAGES[restaurant.id]
            return (
              <Link
                key={restaurant.id}
                href={`/compare/${restaurant.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200
                           shadow-card hover:shadow-card-hover transition-all duration-200
                           hover:-translate-y-0.5"
              >
                <div className="relative h-40 overflow-hidden">
                  {imgSrc && (
                    <img
                      src={imgSrc}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {i === 0 && (
                    <span
                      className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full shadow-md"
                      style={{ background: '#D4A843', color: '#fff' }}
                    >
                      Mejor ahorro
                    </span>
                  )}

                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-sm truncate drop-shadow">
                      {restaurant.name}
                    </p>
                    <p className="text-white/70 text-xs truncate">
                      {restaurant.address}{restaurant.city && `, ${restaurant.city}`}
                    </p>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-extrabold text-green-600">
                        -{summary.max_savings.toFixed(2)} &euro;
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">vs la plataforma mas cara</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-700">
                        desde {summary.min_price.toFixed(2)} &euro;
                      </p>
                      <p className="text-xs text-slate-400">
                        en {PLATFORM_NAMES[summary.winner_platform]}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-slate-800 text-center mb-8">Como funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: '1',
              title: 'Busca tu restaurante',
              desc: 'Escribe el nombre del restaurante donde quieres pedir. Buscamos en todas las plataformas.',
              icon: (
                <svg className="w-7 h-7 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
            },
            {
              num: '2',
              title: 'Compara el precio real',
              desc: 'Vemos el precio final con envio y tasas en Uber Eats, Glovo y Just Eat. Todo incluido.',
              icon: (
                <svg className="w-7 h-7 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
            },
            {
              num: '3',
              title: 'Pide en la mas barata',
              desc: 'Te llevamos directamente al restaurante en la plataforma mas barata. Solo un click.',
              icon: (
                <svg className="w-7 h-7 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map((step) => (
            <div
              key={step.num}
              className="bg-white rounded-2xl p-6 shadow-card border border-slate-100
                         hover:shadow-card-hover transition-shadow relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 text-6xl font-black opacity-[0.04] text-slate-900 select-none leading-none">
                {step.num}
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATAFORMAS ── */}
      <section style={{ background: 'linear-gradient(135deg, #1d4949 0%, #2D6F6F 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <h2 className="text-lg font-bold text-white mb-2">
            Comparamos los precios en estas plataformas
          </h2>
          <p className="text-sm text-white/55 mb-8">
            Precio del producto + envio + tasas de servicio. Sin letra pequena.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Uber Eats', cls: 'bg-black text-white',           desc: 'Rapido y con promos frecuentes' },
              { name: 'Glovo',     cls: 'bg-yellow-400 text-yellow-900', desc: 'Variedad y envio flexible' },
              { name: 'Just Eat',  cls: 'bg-orange-500 text-white',      desc: 'Generalmente el mas barato' },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl
                           px-6 py-4 border border-white/20 min-w-[200px]"
              >
                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${p.cls}`}>
                  {p.name}
                </span>
                <span className="text-sm text-white/70">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
