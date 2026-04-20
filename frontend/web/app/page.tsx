import Image from 'next/image'
import { SearchBar } from '@/components/SearchBar'

export default function HomePage() {
  return (
    <div>
      {/* Hero section con fondo de marca */}
      <section className="relative bg-brand-500 overflow-hidden">
        {/* Patron decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
          {/* Logo centrado */}
          <Image
            src="/logo3.png"
            alt="HungryDeal"
            width={80}
            height={80}
            className="drop-shadow-lg mb-6"
          />

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Encuentra el mejor precio para tu pedido
          </h1>

          <p className="text-lg md:text-xl text-brand-100 mb-8 max-w-2xl">
            Compara el precio total en Uber Eats, Glovo y Just Eat
            con envio y tasas incluidas.
          </p>

          {/* Buscador principal */}
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-2">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Busquedas rapidas */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-2">
          <span className="text-sm text-slate-400 mr-1 self-center">Prueba con:</span>
          {["McDonald's", 'KFC', 'Burger King', 'Pizza Hut', "Domino's"].map((name) => (
            <a
              key={name}
              href={`/search?q=${encodeURIComponent(name)}`}
              className="text-sm bg-white border border-slate-200 text-slate-600 px-4 py-2
                         rounded-full hover:border-brand-400 hover:text-brand-600
                         transition-colors duration-150 shadow-sm"
            >
              {name}
            </a>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">
          Como funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
              title: 'Busca tu restaurante',
              desc: 'Escribe el nombre del sitio donde quieres pedir',
            },
            {
              icon: (
                <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: 'Compara precios',
              desc: 'Ve el precio total en cada plataforma, con todo incluido',
            },
            {
              icon: (
                <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Ahorra dinero',
              desc: 'Elige la mas barata y haz tu pedido directamente',
            },
          ].map((step) => (
            <div
              key={step.title}
              className="bg-white rounded-2xl p-6 shadow-card border border-slate-100
                         text-center hover:shadow-card-hover transition-shadow"
            >
              <div className="flex justify-center mb-4 w-14 h-14 mx-auto rounded-full
                              bg-brand-50 items-center">
                {step.icon}
              </div>
              <h3 className="font-semibold text-slate-700 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
